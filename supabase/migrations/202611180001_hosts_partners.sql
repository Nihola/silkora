alter table public.hosts add column if not exists accessibility jsonb not null default '{}'::jsonb;
alter table public.hosts add column if not exists experience_types text[] not null default '{}';
alter table public.places add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.places add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected'));
alter table public.packages add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected'));
alter table public.products add column if not exists moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'rejected'));

-- Partner dashboards only expose live requests addressed to the partner's listing.
alter table public.places enable row level security;
alter table public.packages enable row level security;
alter table public.products enable row level security;
drop policy if exists "Partners read requests for their listings" on public.booking_requests;
create policy "Partners read requests for their listings" on public.booking_requests for select to authenticated using (
  (target_type = 'place' and exists (select 1 from public.places p where p.id = target_id and p.owner_id = auth.uid()))
  or (target_type = 'package' and exists (select 1 from public.packages p where p.id = target_id and p.agency_id = auth.uid()))
  or (target_type = 'product' and exists (select 1 from public.products p where p.id = target_id and p.artisan_id = auth.uid()))
  or (target_type = 'host' and exists (select 1 from public.hosts h where h.id = target_id and h.profile_id = auth.uid()))
);
drop policy if exists "Partners update requests for their listings" on public.booking_requests;
create policy "Partners update requests for their listings" on public.booking_requests for update to authenticated using (
  status = 'pending' and (
    (target_type = 'place' and exists (select 1 from public.places p where p.id = target_id and p.owner_id = auth.uid()))
    or (target_type = 'package' and exists (select 1 from public.packages p where p.id = target_id and p.agency_id = auth.uid()))
    or (target_type = 'product' and exists (select 1 from public.products p where p.id = target_id and p.artisan_id = auth.uid()))
    or (target_type = 'host' and exists (select 1 from public.hosts h where h.id = target_id and h.profile_id = auth.uid()))
  )
) with check (status in ('accepted', 'declined'));
