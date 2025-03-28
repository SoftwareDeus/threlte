-- Create lobbies table
create table public.lobbies (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    host_id uuid references auth.users(id) not null,
    player2_id uuid references auth.users(id),
    status text not null check (status in ('waiting', 'playing')),
    created timestamp with time zone default timezone('utc'::text, now()) not null,
    time_control jsonb,
    constraint valid_status check (status in ('waiting', 'playing'))
);

-- Enable Row Level Security (RLS)
alter table public.lobbies enable row level security;

-- Create policies
create policy "Users can view all lobbies"
    on public.lobbies for select
    to authenticated
    using (true);

create policy "Users can create lobbies"
    on public.lobbies for insert
    to authenticated
    with check (auth.uid() = host_id);

create policy "Users can update their own lobbies"
    on public.lobbies for update
    to authenticated
    using (auth.uid() = host_id or auth.uid() = player2_id);

create policy "Users can delete their own lobbies"
    on public.lobbies for delete
    to authenticated
    using (auth.uid() = host_id);

-- Create indexes for better performance
create index lobbies_host_id_idx on public.lobbies(host_id);
create index lobbies_player2_id_idx on public.lobbies(player2_id);
create index lobbies_status_idx on public.lobbies(status);

-- Add comments for documentation
comment on table public.lobbies is 'Stores chess game lobbies where players can join and start games';
comment on column public.lobbies.id is 'Unique identifier for the lobby';
comment on column public.lobbies.name is 'Display name for the lobby';
comment on column public.lobbies.host_id is 'User ID of the lobby creator';
comment on column public.lobbies.player2_id is 'User ID of the second player (if joined)';
comment on column public.lobbies.status is 'Current status of the lobby (waiting or playing)';
comment on column public.lobbies.created is 'Timestamp when the lobby was created';
comment on column public.lobbies.time_control is 'JSON object containing time control settings (minutes and increment)'; 