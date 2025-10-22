-- yononaka-card: initial schema and RLS
-- Enable extensions
create extension if not exists pgcrypto;

-- ENUM-like constraints
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  round integer not null default 1,
  phase text not null default 'waiting' check (phase in ('waiting','genre','answer','present','reaction','result')),
  genre text,
  presenter_id uuid,
  started_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  name text not null,
  role text not null default 'player' check (role in ('host','player')),
  score integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (game_id, user_id)
);

-- presenter_id references players after players exists
alter table public.games
  add constraint games_presenter_fk
  foreign key (presenter_id) references public.players(id)
  on delete set null;

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  round integer not null,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  round integer not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  round integer not null,
  from_player_id uuid not null references public.players(id) on delete cascade,
  to_player_id uuid not null references public.players(id) on delete cascade,
  kind text not null check (kind in ('unique','practical','surprise')),
  points integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rules (
  game_id uuid primary key references public.games(id) on delete cascade,
  answer_seconds integer not null default 120,
  note_seconds integer not null default 60,
  reaction_points_min integer not null default 1,
  reaction_points_max integer not null default 5,
  bonus_free_topic_multiplier numeric not null default 2.0
);

-- Indexes helpful for realtime
create index if not exists idx_players_game on public.players(game_id);
create index if not exists idx_answers_game_round on public.answers(game_id, round);
create index if not exists idx_notes_game_round on public.notes(game_id, round);
create index if not exists idx_reactions_game_round on public.reactions(game_id, round);

-- RLS
alter table public.games enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;
alter table public.notes enable row level security;
alter table public.reactions enable row level security;
alter table public.rules enable row level security;

-- GAMES policies
create policy "Games readable to members" on public.games
  for select using (
    exists (
      select 1 from public.players p
      where p.game_id = games.id and p.user_id = auth.uid()
    )
  );

create policy "Games insert by authenticated" on public.games
  for insert with check (auth.role() = 'authenticated');

create policy "Games update by host only" on public.games
  for update using (
    exists (
      select 1 from public.players p
      where p.game_id = games.id and p.user_id = auth.uid() and p.role = 'host'
    )
  );

-- PLAYERS policies
create policy "Players readable to members" on public.players
  for select using (
    exists (
      select 1 from public.players me
      where me.game_id = players.game_id and me.user_id = auth.uid()
    )
  );

create policy "Players insert self only" on public.players
  for insert with check (
    user_id = auth.uid()
  );

create policy "Players update self (no score change)" on public.players
  for update using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and score = coalesce((select score from public.players where id = id), 0)
  );

-- ANSWERS policies
create policy "Answers readable to members" on public.answers
  for select using (
    exists (
      select 1 from public.players me
      where me.game_id = answers.game_id and me.user_id = auth.uid()
    )
  );

create policy "Answers insert self only" on public.answers
  for insert with check (
    exists (
      select 1 from public.players me
      where me.id = answers.player_id and me.user_id = auth.uid()
    )
  );

-- NOTES policies
create policy "Notes readable to members" on public.notes
  for select using (
    exists (
      select 1 from public.players me
      where me.game_id = notes.game_id and me.user_id = auth.uid()
    )
  );

create policy "Notes insert self only" on public.notes
  for insert with check (
    exists (
      select 1 from public.players me
      where me.id = notes.player_id and me.user_id = auth.uid()
    )
  );

-- REACTIONS policies
create policy "Reactions readable to members" on public.reactions
  for select using (
    exists (
      select 1 from public.players me
      where me.game_id = reactions.game_id and me.user_id = auth.uid()
    )
  );

-- Do not allow client inserts/updates/deletes on reactions (Edge Function with service role will bypass RLS)

-- RULES policies
create policy "Rules readable to members" on public.rules
  for select using (
    exists (
      select 1 from public.players me
      where me.game_id = rules.game_id and me.user_id = auth.uid()
    )
  );

create policy "Rules upsert by host only" on public.rules
  for all using (
    exists (
      select 1 from public.players p
      where p.game_id = rules.game_id and p.user_id = auth.uid() and p.role = 'host'
    )
  ) with check (
    exists (
      select 1 from public.players p
      where p.game_id = rules.game_id and p.user_id = auth.uid() and p.role = 'host'
    )
  );


