import { notFound } from 'next/navigation';
import { publicPages } from '@/lib/data';
import { PublicNav, PublicFooter, FAQ, ContactForm } from '@/components/public';
import { AuthForm } from '@/components/auth-form';
import { localMode } from '@/lib/firebase-admin';
import { get } from '@/lib/store';
export const dynamic = 'force-dynamic';
export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (['login', 'register', 'forgot-password'].includes(slug))
    return <AuthForm mode={slug as 'login' | 'register' | 'forgot-password'} local={localMode()} />;
  if (slug === 'faq')
    return (
      <>
        <PublicNav />
        <main className="container prose-page">
          <span className="eyebrow red">A LITTLE MORE CLARITY</span>
          <h1>
            Frequently asked.
            <br />
            Clearly answered.
          </h1>
          <FAQ />
        </main>
        <PublicFooter />
      </>
    );
  if (slug === 'contact')
    return (
      <>
        <PublicNav />
        <main className="container prose-page">
          <div className="split">
            <div>
              <span className="eyebrow red">LET’S CONNECT</span>
              <h1>
                A conversation
                <br />
                starts here.
              </h1>
              <p className="muted">
                Have a question about your demo experience? Leave a message for the platform
                administrator.
              </p>
              <p className="small muted">Demo support inbox · no external email is sent.</p>
            </div>
            <ContactForm />
          </div>
        </main>
        <PublicFooter />
      </>
    );
  if (!Object.hasOwn(publicPages, slug)) notFound();
  const page = publicPages[slug];
  let stored: { title: string; body: string } | undefined;
  try {
    stored = await get('content', slug);
  } catch {}
  return (
    <>
      <PublicNav />
      <main className="container prose-page narrow">
        <span className="eyebrow red">VOLTERRA · A FICTIONAL PLATFORM</span>
        <h1>{stored?.title ?? page.title}</h1>
        <p className="lead muted preserve-lines">{stored?.body ?? page.intro}</p>
        {page.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p className="muted">{body}</p>
          </section>
        ))}
      </main>
      <PublicFooter />
    </>
  );
}
