import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Notice, PageHeader } from '../ui';
import { SiteForm } from './site-form';
import type { SiteSettings } from '@/lib/types';

export default async function AdminSitePage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle<SiteSettings>();

  return (
    <>
      <PageHeader title="Site content" description="Studio details and page copy shown on the public website, in English and Arabic." />
      {error || !data ? <Notice tone="error">Could not load site settings{error ? `: ${error.message}` : '.'}</Notice> : <SiteForm settings={data} />}
    </>
  );
}
