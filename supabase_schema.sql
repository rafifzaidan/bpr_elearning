-- 1. Create a custom type for roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- 2. Create the Profiles table to mirror auth.users
CREATE TABLE public.profiles (
  id UUID references auth.users(id) on delete cascade not null primary key,
  name text,
  role public.app_role default 'user'::public.app_role,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: In Supabase Dashboard, you can manually set a user's role to 'admin' 
-- by editing the `profiles` table directly.

-- 3. Create the Courses table
CREATE TABLE public.courses (
  id UUID default gen_random_uuid() primary key,
  title text not null,
  description text,
  thumbnail text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create the Modules table
CREATE TABLE public.modules (
  id UUID default gen_random_uuid() primary key,
  course_id UUID references public.courses(id) on delete cascade not null,
  title text not null,
  video_url text,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create the pivot table for Module Completion (Module_User)
CREATE TABLE public.module_user (
  id UUID default gen_random_uuid() primary key,
  module_id UUID references public.modules(id) on delete cascade not null,
  user_id UUID references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (module_id, user_id)
);


----------- ROW LEVEL SECURITY (RLS) -----------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_user ENABLE ROW LEVEL SECURITY;


-- PROFILES: Users can read their own profile. Admins can read all profiles.
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);


-- COURSES: Everyone can view courses. Only Admins can insert/update/delete.
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- MODULES: Everyone can view modules. Only Admins can insert/update/delete.
CREATE POLICY "Anyone can view modules" ON public.modules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage modules" ON public.modules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- MODULE_USER (Completion Tracking): Users can insert and read their OWN progress.
CREATE POLICY "Users can see own progress" ON public.module_user
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.module_user
  FOR INSERT WITH CHECK (auth.uid() = user_id);


----------- TRIGGERS -----------

-- Auto-create a profile when a new user signs up in Supabase Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'name', -- Picks up name if sent during signup (optional)
    'user'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
