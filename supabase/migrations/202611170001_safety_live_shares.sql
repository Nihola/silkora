-- Broadcast only a sanitized point on a private token-specific channel. Do not expose
-- the location table itself through the public REST API.
create or replace function public.can_read_live_share_topic(topic text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.live_shares share
    where share.id::text = split_part(topic, ':', 2)
      and topic like 'live-share:%'
      and share.stopped_at is null
      and share.expires_at > now()
  );
$$;
grant execute on function public.can_read_live_share_topic(text) to anon, authenticated;

drop policy if exists "View active live share broadcasts by token" on realtime.messages;
create policy "View active live share broadcasts by token" on realtime.messages
for select to anon, authenticated
using (extension = 'broadcast' and public.can_read_live_share_topic(realtime.topic()));

create or replace function public.broadcast_live_share_location()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send(
    payload := jsonb_build_object('lat', new.lat, 'lng', new.lng, 'expires_at', new.expires_at, 'updated_at', new.updated_at, 'stopped_at', new.stopped_at),
    event := 'location',
    topic := 'live-share:' || new.id::text,
    private := true
  );
  return new;
end;
$$;
drop trigger if exists live_share_location_broadcast on public.live_shares;
create trigger live_share_location_broadcast after insert or update on public.live_shares
for each row execute function public.broadcast_live_share_location();

alter table public.emergency_contacts add column if not exists telegram_chat_id text;
alter table public.emergency_contacts add column if not exists link_token text unique;
alter table public.emergency_contacts add column if not exists linked_at timestamptz;
alter table public.emergency_contacts add column if not exists notification_consent boolean not null default false;
alter table public.checkins add column if not exists alerted_at timestamptz;
alter table public.live_shares add column if not exists updated_at timestamptz not null default now();

