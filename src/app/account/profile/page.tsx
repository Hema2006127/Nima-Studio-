import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getDictionary } from '@/lib/i18n/server';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from './profile-form';
import type { Profile } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.account.profile };
}

export default async function ProfilePage() {
  const user = await requireUser('/account/profile');
  const { t } = await getDictionary();
  const supabase = await createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle<Profile>();

  return (
    <div className="max-w-lg">
      <h1 className="display text-5xl">{t.account.profileTitle}</h1>
      <div className="card mt-8 p-6 sm:p-8">
        <ProfileForm t={t} email={user.email ?? ''} fullName={profile?.full_name ?? ''} phone={profile?.phone ?? ''} />
      </div>
    </div>
  );
}
