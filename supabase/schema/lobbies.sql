create table public.lobbies (
  id uuid not null default gen_random_uuid (),
  name text not null,
  host_id uuid not null,
  player2_id uuid null,
  status text not null,
  created timestamp with time zone not null default timezone ('utc'::text, now()),
  time_control jsonb null,
  slots jsonb null,
  constraint lobbies_pkey primary key (id),
  constraint lobbies_host_id_fkey foreign KEY (host_id) references auth.users (id),
  constraint lobbies_player2_id_fkey foreign KEY (player2_id) references auth.users (id),
  constraint lobbies_status_check check (
    (
      status = any (array['waiting'::text, 'playing'::text])
    )
  ),
  constraint valid_status check (
    (
      status = any (array['waiting'::text, 'playing'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists lobbies_host_id_idx on public.lobbies using btree (host_id) TABLESPACE pg_default;

create index IF not exists lobbies_player2_id_idx on public.lobbies using btree (player2_id) TABLESPACE pg_default;

create index IF not exists lobbies_status_idx on public.lobbies using btree (status) TABLESPACE pg_default;