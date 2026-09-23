import Link from 'next/link';
import { getDictionary } from '@/lib/i18n/server';
import { getHomeFilms, getPublishedServices, getSiteSettings } from '@/lib/data';
import { localized } from '@/lib/utils';
import { VideoPlayer } from '@/components/video-player';
import { ArrowIcon, PlayIcon } from '@/components/icons';
import { ContactButtons, EmptyState, LoadError, PortfolioCard, SectionHeading, ServiceCard } from '@/components/sections';

export default async function HomePage() {
  const [{ locale, t }, settings, films, services] = await Promise.all([
    getDictionary(),
    getSiteSettings(),
    getHomeFilms(3),
    getPublishedServices(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="container-x grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
        <div className="order-2 lg:order-1">
          <p className="eyebrow mb-5">{settings ? localized(settings, 'tagline', locale) : t.home.eyebrow}</p>
          <h1 className="display text-5xl sm:text-6xl lg:text-7xl">{settings && localized(settings, 'hero_title', locale)}</h1>
          <p className="mt-6 max-w-md leading-relaxed text-ink-soft">{settings && localized(settings, 'hero_subtitle', locale)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/book" className="btn-primary">
              {t.nav.book}
            </Link>
            <Link href="/portfolio" className="btn-outline">
              <PlayIcon size={12} className="flip-rtl" /> {t.home.watchFilms}
            </Link>
          </div>
          {(settings?.whatsapp_number || settings?.instagram_url) && (
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink-soft">
              <span>{t.home.preferChat}</span>
              <ContactButtons settings={settings} t={t} variant="inline" />
            </div>
          )}
        </div>
        {/* Vertical 9:16 reel frame — best with a vertical video (YouTube Short / Drive) */}
        <div className="order-1 mx-auto w-full max-w-[280px] sm:max-w-[320px] lg:order-2 lg:max-w-[340px]">
          {settings?.showreel_video_id ? (
            <VideoPlayer
              provider={settings.showreel_provider}
              videoId={settings.showreel_video_id}
              title={t.home.showreel}
              size="lg"
              playLabel={t.common.play}
              aspect="aspect-[9/16]"
              className="shadow-xl"
            />
          ) : (
            <div className="aspect-[9/16] bg-media" />
          )}
        </div>
      </section>

      {/* Recent films */}
      <section className="container-x pb-16 lg:pb-20">
        <div className="mb-14 border-t border-line lg:mb-16" />
        <SectionHeading
          eyebrow={t.home.portfolioEyebrow}
          title={t.home.recentFilms}
          action={
            <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm hover:text-accent">
              {t.common.viewAll} <ArrowIcon size={14} />
            </Link>
          }
        />
        {films.error ? (
          <LoadError t={t} />
        ) : films.data.length === 0 ? (
          <EmptyState>{t.home.noFilms}</EmptyState>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {films.data.map((item) => (
              <div key={item.id} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <PortfolioCard item={item} locale={locale} t={t} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section className="bg-surface py-16 lg:py-24">
        <div className="container-x">
          <SectionHeading eyebrow={t.home.servicesEyebrow} title={t.home.whatWeCapture} />
          {services.error ? (
            <LoadError t={t} />
          ) : services.data.length === 0 ? (
            <EmptyState>{t.home.noServices}</EmptyState>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {services.data.map((s, i) => (
                <ServiceCard key={s.id} service={s} index={i} locale={locale} t={t} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How booking works */}
      <section className="container-x py-16 lg:py-24">
        <SectionHeading eyebrow={t.home.howEyebrow} title={t.home.fourSteps} />
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.home.steps.map((step, i) => (
            <li key={step.title} className={`border-t-2 pt-4 ${i === 0 ? 'border-ink' : 'border-line'}`}>
              <p className="text-xs text-accent">
                {t.home.step} {i + 1}
              </p>
              <h3 className="mt-2 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>

        {/* CTA band */}
        <div className="mt-20 flex flex-col gap-8 bg-band px-8 py-12 text-band-fg lg:flex-row lg:items-center lg:justify-between lg:px-14">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl">{t.home.ctaTitle}</h2>
            <p className="mt-3 text-sm opacity-80">{t.home.ctaText}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ContactButtons settings={settings} t={t} variant="band" />
            <Link href="/book" className="btn bg-band-fg text-band hover:opacity-90">
              {t.nav.book}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
