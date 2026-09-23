-- Videos can now be hosted on YouTube or Google Drive.
-- Only the validated provider + file/video ID is stored (never raw URLs or embed code).

-- Portfolio items ------------------------------------------------------------
alter table public.portfolio_items rename column youtube_video_id to video_id;
alter table public.portfolio_items drop constraint portfolio_items_youtube_video_id_check;
alter table public.portfolio_items
  add column video_provider text not null default 'youtube'
    check (video_provider in ('youtube', 'drive'));
alter table public.portfolio_items
  add constraint portfolio_items_video_id_check check (
    (video_provider = 'youtube' and video_id ~ '^[A-Za-z0-9_-]{11}$')
    or (video_provider = 'drive' and video_id ~ '^[A-Za-z0-9_-]{20,100}$')
  );

-- Home page showreel ---------------------------------------------------------
alter table public.site_settings rename column showreel_youtube_id to showreel_video_id;
alter table public.site_settings drop constraint site_settings_showreel_youtube_id_check;
alter table public.site_settings
  add column showreel_provider text not null default 'youtube'
    check (showreel_provider in ('youtube', 'drive'));
alter table public.site_settings
  add constraint site_settings_showreel_video_id_check check (
    showreel_video_id is null
    or (showreel_provider = 'youtube' and showreel_video_id ~ '^[A-Za-z0-9_-]{11}$')
    or (showreel_provider = 'drive' and showreel_video_id ~ '^[A-Za-z0-9_-]{20,100}$')
  );
