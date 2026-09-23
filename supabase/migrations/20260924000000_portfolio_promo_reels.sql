-- Portfolio categories are now only "promo" and "reel".
-- Existing items: reel stays reel, everything else becomes promo.

alter type public.portfolio_category rename to portfolio_category_old;
create type public.portfolio_category as enum ('promo', 'reel');

alter table public.portfolio_items alter column category drop default;
alter table public.portfolio_items
  alter column category type public.portfolio_category
  using (case when category::text = 'reel' then 'reel' else 'promo' end)::public.portfolio_category;
alter table public.portfolio_items alter column category set default 'promo';

drop type public.portfolio_category_old;
