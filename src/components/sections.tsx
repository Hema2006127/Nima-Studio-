import Link from 'next/link';
import { ChatIcon, InstagramIcon } from './icons';
import { VideoPlayer } from './video-player';
import { storagePublicUrl } from '@/lib/supabase/env';
import { formatMonthYear, formatMoney, localized, whatsappLink } from '@/lib/utils';
import type { Dictionary, Locale } from '@/lib/i18n/dictionaries';
import type { PortfolioItem, Service, SiteSettings } from '@/lib/types';

export function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h2 className="display text-4xl sm:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PortfolioCard({
  item,
  locale,
  t,
  showCategory = false,
}: {
  item: PortfolioItem;
  locale: Locale;
  t: Dictionary;
  showCategory?: boolean;
}) {
  const title = localized(item, 'title', locale);
  const description = localized(item, 'description', locale);
  const meta = [t.categories[item.category], item.venue, formatMonthYear(item.event_date, locale)].filter(Boolean).join(' · ');

  return (
    <article>
      <VideoPlayer
        provider={item.video_provider}
        videoId={item.video_id}
        title={title}
        coverUrl={storagePublicUrl(item.cover_image_path)}
        playLabel={t.common.play}
        badge={
          showCategory ? (
            <span className="bg-bg/90 px-2 py-1 text-[10px] uppercase tracking-[0.15em] text-ink">{t.categories[item.category]}</span>
          ) : undefined
        }
      />
      <h3 className="mt-4 font-display text-2xl text-ink">{title}</h3>
      {meta && <p className="mt-1 text-xs text-ink-soft">{meta}</p>}
      {description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{description}</p>}
    </article>
  );
}

export function ServiceCard({ service, index, locale, t }: { service: Service; index: number; locale: Locale; t: Dictionary }) {
  return (
    <article className="card flex flex-col p-7">
      <p className="font-display text-sm text-ink-soft">{String(index + 1).padStart(2, '0')}</p>
      <h3 className="mt-3 font-display text-3xl">{localized(service, 'title', locale)}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">{localized(service, 'description', locale)}</p>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-sm">
        <span>
          {service.price_from !== null
            ? `${t.common.from} ${formatMoney(service.price_from, service.currency, locale)}`
            : t.common.priceOnRequest}
        </span>
        <Link href={`/book?service=${service.slug}`} className="link">
          {t.common.bookThis}
        </Link>
      </div>
    </article>
  );
}

export function ContactButtons({
  settings,
  t,
  variant = 'outline',
  className = '',
}: {
  settings: SiteSettings | null;
  t: Dictionary;
  variant?: 'outline' | 'inline' | 'band';
  className?: string;
}) {
  const wa = whatsappLink(settings?.whatsapp_number);
  const ig = settings?.instagram_url;
  if (!wa && !ig) return null;

  const cls =
    variant === 'inline'
      ? 'inline-flex items-center gap-1.5 text-xs text-ink hover:text-accent'
      : variant === 'band'
        ? 'btn border border-band-fg/50 text-band-fg hover:bg-band-fg/10'
        : 'btn-outline';

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}>
          <ChatIcon size={variant === 'inline' ? 14 : 16} /> {t.common.whatsapp}
        </a>
      )}
      {ig && (
        <a href={ig} target="_blank" rel="noopener noreferrer" className={cls}>
          <InstagramIcon size={variant === 'inline' ? 14 : 16} /> {t.common.instagram}
        </a>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="border border-dashed border-line px-6 py-14 text-center text-sm text-ink-soft">{children}</div>;
}

export function LoadError({ t }: { t: Dictionary }) {
  return <div className="border border-danger/30 bg-danger/5 px-6 py-10 text-center text-sm text-danger">{t.common.somethingWrong}</div>;
}
