-- Starter services (edit or delete them from /admin/services).
-- Portfolio items are intentionally not seeded: add your YouTube films from /admin/portfolio.
insert into public.services (slug, title_en, title_ar, description_en, description_ar, price_from, sort_order, is_published)
values
  ('wedding-film', 'Wedding film', 'فيلم الفرح',
   'A cinematic highlight film of your day, from getting ready to the last dance.',
   'فيلم سينمائي ليومكم من التجهيز لآخر رقصة.', null, 1, true),
  ('photography', 'Photography', 'التصوير الفوتوغرافي',
   'Natural, editorial portraits and candid moments, delivered as a private gallery.',
   'صور طبيعية وتلقائية في جاليري خاص بيكم.', null, 2, true),
  ('engagements-reels', 'Engagements & reels', 'خطوبة وريلز',
   'Short vertical reels and engagement sessions, cut for Instagram and TikTok.',
   'ريلز قصيرة جاهزة لإنستجرام وتيك توك.', null, 3, true)
on conflict (slug) do nothing;
