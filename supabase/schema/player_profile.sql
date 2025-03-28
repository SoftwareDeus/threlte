create table public.player_profiles (
  id uuid not null default extensions.uuid_generate_v4 (),
  username text not null,
  avatar_url text null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  last_seen timestamp with time zone not null default timezone ('utc'::text, now()),
  rating integer not null default 1000,
  games_played integer not null default 0,
  games_won integer not null default 0,
  games_lost integer not null default 0,
  win_rate double precision not null default 0,
  display_name text null,
  auth_user_id uuid not null,
  constraint player_profiles_pkey primary key (id),
  constraint player_profiles_auth_user_id_key unique (auth_user_id),
  constraint player_profiles_username_key unique (username)
) TABLESPACE pg_default;

create index IF not exists idx_player_profiles_username on public.player_profiles using btree (username) TABLESPACE pg_default;

create index IF not exists idx_player_profiles_rating on public.player_profiles using btree (rating) TABLESPACE pg_default;

create index IF not exists idx_player_profiles_auth_user_id on public.player_profiles using btree (auth_user_id) TABLESPACE pg_default;

create trigger update_player_profiles_last_seen BEFORE
update on player_profiles for EACH row
execute FUNCTION update_last_seen ();