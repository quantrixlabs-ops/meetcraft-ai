-- Enable Vector Extension
create extension if not exists vector;

-- 1. PROFILES (Extends Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROJECTS (Knowledge Packages)
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  industry text,
  meta jsonb, -- Stores full UserInput
  overview jsonb,
  agenda jsonb,
  slides jsonb,
  takeaways jsonb,
  book_chapters jsonb,
  sources jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. DOCUMENTS (Source Files)
create table documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  project_id uuid references projects on delete cascade,
  filename text not null,
  content text, -- Raw text content
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. DOCUMENT CHUNKS (Vectors)
create table document_chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  metadata jsonb,
  embedding vector(768), -- Gemini Text Embedding 004 dimension
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. USAGE LOGS (Governance)
create table usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  feature text not null,
  tokens int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. API KEYS (BYOK - Encrypted)
create table api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  provider text not null, -- 'google', 'openai', etc.
  key_ciphertext text not null, -- Encrypted key
  key_mask text not null, -- Last 4 chars for UI
  label text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS POLICIES (Security)

-- Profiles
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Projects
alter table projects enable row level security;
create policy "Users can CRUD own projects" on projects for all using (auth.uid() = user_id);

-- Documents
alter table documents enable row level security;
create policy "Users can CRUD own documents" on documents for all using (auth.uid() = user_id);

-- Chunks
alter table document_chunks enable row level security;
create policy "Users can CRUD own chunks" on document_chunks for all using (auth.uid() = user_id);

-- Logs
alter table usage_logs enable row level security;
create policy "Users can view own logs" on usage_logs for select using (auth.uid() = user_id);

-- API Keys
alter table api_keys enable row level security;
create policy "Users can CRUD own api_keys" on api_keys for all using (auth.uid() = user_id);


-- FUNCTIONS

-- Similarity Search Function
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query(
    select
      document_chunks.id,
      document_chunks.content,
      document_chunks.metadata,
      1 - (document_chunks.embedding <=> query_embedding) as similarity
    from document_chunks
    where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and document_chunks.user_id = filter_user_id
    order by document_chunks.embedding <=> query_embedding
    limit match_count
  );
end;
$$;

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();