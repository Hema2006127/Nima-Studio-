import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/server';
import { format } from '@/lib/i18n/dictionaries';
import { getUser } from '@/lib/auth';
import { getPublishedServices, getSiteSettings } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { localized, whatsappLink } from '@/lib/utils';
import { MinimalHeader } from '@/components/minimal-header';
import { AuthPanel } from '@/components/auth-panel';
import { ChatIcon } from '@/components/icons';
import { BookingForm } from './booking-form';
import { VerifyNotice } from './verify-notice';
import { Steps } from '@/components/booking-steps';
import type { Profile } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.booking.title };
}

export default async function BookPage({ searchParams }: PageProps<'/book'>) {
  const { service } = await searchParams;
  const serviceSlug = typeof service === 'string' && /^[a-z0-9-]{1,80}$/.test(service) ? service : undefined;
  const [{ locale, t }, user, settings] = await Promise.all([getDictionary(), getUser(), getSiteSettings()]);

  const step = !user ? 1 : 2;
  const next = serviceSlug ? `/book?service=${serviceSlug}` : '/book';
  const wa = whatsappLink(settings?.whatsapp_number);

  let panel: React.ReactNode;
  if (!user) {
    panel = <AuthPanel t={t} next={next} title={t.auth.signInTitle} text={t.auth.signInText} />;
  } else if (!user.email_confirmed_at) {
    panel = <VerifyNotice t={t} text={format(t.auth.notVerifiedText, { email: user.email ?? '' })} />;
  } else {
    const supabase = await createClient();
    const [{ data: services }, { data: profile }] = await Promise.all([
      getPublishedServices(),
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>(),
    ]);
    panel = (
      <div className="card p-6 sm:p-10">
        <h2 className="font-display text-3xl">{t.booking.detailsTitle}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t.booking.detailsText}</p>
        <p className="mt-3 text-xs text-ink-soft">{format(t.booking.signedInAs, { email: user.email ?? '' })}</p>
        <BookingForm
          t={t}
          services={services.map((s) => ({ id: s.id, slug: s.slug, title: localized(s, 'title', locale) }))}
          preselectedSlug={serviceSlug}
          defaults={{ name: profile?.full_name ?? '', phone: profile?.phone ?? '' }}
          minDate={new Date().toISOString().slice(0, 10)}
        />
      </div>
    );
  }

  return (
    <>
      <MinimalHeader />
      <main className="container-x grid gap-12 py-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:py-16">
        <div>
          <p className="eyebrow mb-4">{t.booking.eyebrow}</p>
          <h1 className="display text-5xl sm:text-6xl">{t.booking.title}</h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink-soft">{t.booking.intro}</p>
          <Steps t={t} active={step} />
          {wa && (
            <p className="mt-8 flex items-center gap-3 bg-soft px-5 py-4 text-sm text-ink-soft">
              <ChatIcon size={16} className="shrink-0 text-ink" />
              <span>
                {t.booking.question}{' '}
                <a href={wa} target="_blank" rel="noopener noreferrer" className="text-ink underline">
                  {t.booking.messageWhatsapp}
                </a>{' '}
                {t.booking.noAccount}
              </span>
            </p>
          )}
        </div>
        <div>{panel}</div>
      </main>
    </>
  );
}
