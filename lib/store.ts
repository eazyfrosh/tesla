import { promises as fs } from 'node:fs';
import path from 'node:path';
import { db, localMode } from './firebase-admin';
import { demoUser, initialPortfolio, markets, plans, vehicles, settings, stamp } from './data';
import type { Collection } from './types';
type RecordData = Record<string, unknown>;
type Database = Record<string, Record<string, RecordData>>;
export interface Unit {
  get<T>(collection: Collection, id: string): Promise<T | undefined>;
  set(collection: Collection, id: string, value: object): void;
  delete(collection: Collection, id: string): void;
}
const file = path.join(process.cwd(), '.local-data', 'database.json');
let lock: Promise<unknown> = Promise.resolve();
function initial(): Database {
  const data: Database = {};
  const add = (c: string, rows: { id: string }[]) => {
    data[c] = Object.fromEntries(rows.map((row) => [row.id, row as unknown as RecordData]));
  };
  add('users', [demoUser(), demoUser('demo-admin', 'admin')]);
  add('portfolios', [initialPortfolio('demo-user', true), initialPortfolio('demo-admin', true)]);
  add('marketData', markets);
  add('investmentPlans', plans);
  add('vehicles', vehicles);
  add('platformSettings', [settings]);
  add('notifications', [
    {
      ...stamp,
      id: 'welcome',
      uid: 'demo-user',
      title: 'Your next chapter starts here',
      message: 'Welcome to your simulated workspace. No real funds are used.',
      read: false,
    } as { id: string },
  ]);
  add('transactions', [
    {
      ...stamp,
      id: 'welcome-funding',
      uid: 'demo-user',
      type: 'Deposit',
      amountCents: 2450000,
      status: 'Approved',
      reference: 'DEMO-WELCOME',
      details: 'Illustrative opening cash · not real funds',
    } as { id: string },
  ]);
  return data;
}
async function readLocal(): Promise<Database> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
    return initial();
  }
}
export async function atomic<T>(fn: (unit: Unit) => Promise<T>): Promise<T> {
  if (localMode()) {
    const task = lock.then(async () => {
      const data = await readLocal();
      const unit: Unit = {
        get: async <T>(c: Collection, id: string) =>
          structuredClone(data[c]?.[id]) as T | undefined,
        set: (c, id, v) => {
          data[c] ??= {};
          data[c][id] = v as RecordData;
        },
        delete: (c, id) => {
          delete data[c]?.[id];
        },
      };
      const result = await fn(unit);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + '.tmp', JSON.stringify(data));
      await fs.rename(file + '.tmp', file);
      return result;
    });
    lock = task.catch(() => {});
    return task;
  }
  return db().runTransaction(async (tx) => {
    const writes: (() => void)[] = [];
    const unit: Unit = {
      get: async <T>(c: Collection, id: string) => {
        const s = await tx.get(db().collection(c).doc(id));
        return s.exists ? (s.data() as T) : undefined;
      },
      set: (c, id, v) => {
        writes.push(() => tx.set(db().collection(c).doc(id), v));
      },
      delete: (c, id) => {
        writes.push(() => tx.delete(db().collection(c).doc(id)));
      },
    };
    const result = await fn(unit);
    writes.forEach((write) => write());
    return result;
  });
}
export async function get<T>(c: Collection, id: string): Promise<T | undefined> {
  if (localMode()) return (await readLocal())[c]?.[id] as T | undefined;
  const s = await db().collection(c).doc(id).get();
  return s.exists ? (s.data() as T) : undefined;
}
export async function list<T>(c: Collection, uid?: string): Promise<T[]> {
  if (localMode())
    return Object.values((await readLocal())[c] ?? {}).filter((v) => !uid || v.uid === uid) as T[];
  let q: FirebaseFirestore.Query = db().collection(c);
  if (uid) q = q.where('uid', '==', uid);
  return (await q.limit(500).get()).docs.map((d) => d.data() as T);
}
