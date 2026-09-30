import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { adminAuth, localMode } from '@/lib/firebase-admin';
import { initializeAccount } from '@/lib/registration';
import { apiError, apiUser, rateLimit, readJson, sameOrigin } from '@/lib/server';
import { atomic } from '@/lib/store';

export const runtime = 'nodejs';

const createUserSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  fullName: z.string().trim().min(2).max(200),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_]{3,30}$/),
  phone: z.string().trim().max(50).default(''),
  country: z.string().trim().max(100).default(''),
  region: z.string().trim().max(100).default(''),
  city: z.string().trim().max(100).default(''),
  currency: z.enum(['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD']).default('USD'),
});

export async function POST(request: NextRequest) {
  let createdUid: string | undefined;

  try {
    sameOrigin(request);
    const administrator = await apiUser(true);
    await rateLimit(`admin-create-user:${administrator.uid}`, 10);

    if (localMode()) {
      throw new Error('Firebase must be configured before an administrator can create users.');
    }

    const input = createUserSchema.parse(await readJson(request));
    const workspaceId = administrator.workspaceId ?? 'default';
    const account = await adminAuth().createUser({
      email: input.email,
      password: input.password,
      displayName: input.fullName,
      disabled: false,
      emailVerified: false,
    });
    createdUid = account.uid;

    const now = new Date().toISOString();
    await atomic(async (unit) => {
      await initializeAccount(
        unit,
        { uid: account.uid, email: account.email, name: account.displayName },
        {
          fullName: input.fullName,
          username: input.username,
          phone: input.phone,
          country: input.country,
          region: input.region,
          city: input.city,
          currency: input.currency,
          image: '',
        },
        workspaceId,
      );
      unit.set('auditLogs', `user_create_${account.uid}`, {
        id: `user_create_${account.uid}`,
        workspaceId,
        actorId: administrator.uid,
        action: 'adminCreateUser',
        targetId: account.uid,
        targetEmail: input.email,
        createdAt: now,
        updatedAt: now,
      });
    }, workspaceId);

    return NextResponse.json(
      {
        ok: true,
        user: { id: account.uid, email: input.email, fullName: input.fullName },
        message: 'User account created successfully.',
      },
      { status: 201 },
    );
  } catch (error) {
    if (createdUid) {
      await adminAuth()
        .deleteUser(createdUid)
        .catch((rollbackError) => {
          console.error('[admin-create-user] Firebase rollback failed', rollbackError);
        });
    }

    if (error instanceof Error && error.message.includes('email-already-exists')) {
      return NextResponse.json(
        { error: 'An account already uses this email address.' },
        { status: 409 },
      );
    }
    return apiError(error);
  }
}
