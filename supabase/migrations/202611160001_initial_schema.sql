create extension if not exists pgcrypto;

create type public.profile_role as enum ('traveler', 'host', 'guide', 'artisan', 'partner', 'agency');
create type public.place_type as enum ('attraction', 'restaurant', 'cafe', 'hotel', 'hostel', 'atm', 'pharmacy', 'hospital', 'police', 'transport');
create type public.package_style as enum ('culture', 'adventure', 'food', 'family', 'budget', 'luxury');
create type public.booking_status as enum ('pending', 'accepted', 'declined');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  role public.profile_role not null default 'traveler',
  display_name text not null default 'Traveler',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.prevent_profile_role_escalation()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.role is distinct from new.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Profile role changes require a trusted server';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_role_guard before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

create table public.places (
  id uuid primary key default gen_random_uuid(),
  type public.place_type not null,
  name text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  city text not null,
  price_level smallint check (price_level between 1 and 4),
  rating numeric(2,1) check (rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  cuisine text,
  tags text[] not null default '{}',
  opening_hours jsonb not null default '{}',
  accessibility jsonb not null default '{"wheelchair": false, "women_safe": false, "halal": false, "vegetarian": false, "family": false, "budget": false}'::jsonb,
  photo text,
  description text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_accessibility_object check (jsonb_typeof(accessibility) = 'object')
);
create index places_city_type_idx on public.places (city, type);
create index places_geo_idx on public.places (lat, lng);
create index places_tags_idx on public.places using gin (tags);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  city text[] not null default '{}',
  days smallint not null check (days between 1 and 60),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  style public.package_style not null,
  includes text[] not null default '{}',
  itinerary jsonb not null default '[]',
  agency_id uuid references public.profiles(id) on delete set null,
  rating numeric(2,1) check (rating between 0 and 5),
  photo text,
  season text[] not null default '{}',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint packages_itinerary_json check (jsonb_typeof(itinerary) in ('array', 'object'))
);
create index packages_city_idx on public.packages using gin (city);
create index packages_style_days_idx on public.packages (style, days);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('place', 'package', 'product', 'host')),
  target_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  text text not null check (length(text) between 1 and 3000),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index reviews_target_idx on public.reviews (target_type, target_id, created_at desc);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('place', 'package', 'product', 'host')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'My Trip',
  items jsonb not null default '[]',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_items_json check (jsonb_typeof(items) = 'array'),
  constraint trips_dates check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('place', 'package', 'host', 'product')),
  target_id uuid not null,
  dates jsonb not null default '{}',
  guests smallint not null default 1 check (guests between 1 and 100),
  message text not null default '' check (length(message) <= 3000),
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_dates_json check (jsonb_typeof(dates) in ('object', 'array'))
);
create index booking_requests_user_idx on public.booking_requests (user_id, created_at desc);

create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  city text not null,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  vibe text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  rural boolean not null default false,
  women_run boolean not null default false,
  bio text not null default '',
  photo text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index hosts_city_idx on public.hosts (city);

create table public.buddy_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  title text not null,
  message text not null check (length(message) between 1 and 2000),
  interests text[] not null default '{}',
  travel_date date,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
create index buddy_posts_city_expiry_idx on public.buddy_posts (city, expires_at);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  region text not null,
  story text not null default '',
  image text,
  currency text not null default 'USD' check (currency in ('USD', 'UZS')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index products_region_idx on public.products (region);

create table public.price_guide (
  id uuid primary key default gen_random_uuid(),
  item text not null,
  city text not null,
  fair_min numeric(12,2) not null check (fair_min >= 0),
  fair_max numeric(12,2) not null check (fair_max >= fair_min),
  currency text not null default 'UZS' check (currency in ('USD', 'UZS')),
  unit text not null default 'item',
  updated_at timestamptz not null default now(),
  unique (item, city)
);

create table public.scam_alerts (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  title text not null,
  description text not null,
  category text not null default 'general',
  reported_at timestamptz not null default now(),
  verified boolean not null default false,
  is_demo boolean not null default false,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index scam_alerts_city_verified_idx on public.scam_alerts (city, verified, reported_at desc);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  phone_verification text not null default 'TODO_VERIFY',
  relationship text not null default '',
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'resolved', 'cancelled')),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index sos_events_user_idx on public.sos_events (user_id, created_at desc);

create table public.live_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consented_at timestamptz not null,
  expires_at timestamptz not null,
  stopped_at timestamptz,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  constraint live_shares_expiry check (expires_at > consented_at)
);
create index live_shares_user_active_idx on public.live_shares (user_id, expires_at) where stopped_at is null;

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Safe check-in',
  due_at timestamptz,
  checked_in_at timestamptz,
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now()
);
create index checkins_user_due_idx on public.checkins (user_id, due_at);

-- Public catalog data can be read without an account. Writes are performed by trusted server code.
alter table public.places enable row level security;
create policy "Places are readable" on public.places for select using (true);
alter table public.packages enable row level security;
create policy "Packages are readable" on public.packages for select using (true);
alter table public.reviews enable row level security;
create policy "Reviews are readable" on public.reviews for select using (true);
create policy "Users create their own reviews" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "Users edit their own reviews" on public.reviews for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete their own reviews" on public.reviews for delete to authenticated using (user_id = auth.uid());
alter table public.profiles enable row level security;
create policy "Users read their own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "Public partner profiles are readable" on public.profiles for select using (role in ('host', 'guide', 'artisan', 'partner', 'agency'));
create policy "Users create their own profile" on public.profiles for insert to authenticated with check (id = auth.uid() and role = 'traveler');
create policy "Users update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
alter table public.favorites enable row level security;
create policy "Users manage their favorites" on public.favorites for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.trips enable row level security;
create policy "Users manage their trips" on public.trips for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.booking_requests enable row level security;
create policy "Users read their booking requests" on public.booking_requests for select to authenticated using (user_id = auth.uid());
create policy "Users submit booking requests" on public.booking_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "Users cancel pending booking requests" on public.booking_requests for update to authenticated using (user_id = auth.uid() and status = 'pending') with check (user_id = auth.uid() and status = 'pending');
alter table public.hosts enable row level security;
create policy "Hosts are readable" on public.hosts for select using (true);
create policy "Host owners manage their listing" on public.hosts for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid() and verified = false);
alter table public.buddy_posts enable row level security;
create policy "Active buddy posts are readable" on public.buddy_posts for select using (expires_at > now());
create policy "Users manage their buddy posts" on public.buddy_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.products enable row level security;
create policy "Products are readable" on public.products for select using (true);
create policy "Artisans manage their products" on public.products for all to authenticated using (artisan_id = auth.uid()) with check (artisan_id = auth.uid() and verified = false);
alter table public.price_guide enable row level security;
create policy "Price guide is readable" on public.price_guide for select using (true);
alter table public.scam_alerts enable row level security;
create policy "Verified and demo scam alerts are readable" on public.scam_alerts for select using (verified or is_demo);
create policy "Users submit unverified scam alerts" on public.scam_alerts for insert to authenticated with check (submitted_by = auth.uid() and verified = false and is_demo = false);
alter table public.emergency_contacts enable row level security;
create policy "Demo emergency contacts are readable" on public.emergency_contacts for select using (is_demo and user_id is null);
create policy "Users manage their emergency contacts" on public.emergency_contacts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.sos_events enable row level security;
create policy "Users manage their SOS events" on public.sos_events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.live_shares enable row level security;
create policy "Users manage their consented live shares" on public.live_shares for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and consented_at <= now());
alter table public.checkins enable row level security;
create policy "Users manage their check-ins" on public.checkins for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A new Supabase Auth account receives a basic traveler profile.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'traveler', coalesce(new.raw_user_meta_data ->> 'name', 'Traveler'))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
