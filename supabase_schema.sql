-- ============================================
-- HD FIELD TIME — Supabase Database Schema
-- Run this in Supabase > SQL Editor
-- ============================================

-- USERS (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('accounting','crew_manager','worker')),
  company text check (company in ('Construction','Landscape','both')),
  crew text,
  worker_id integer,
  username text unique,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Accounting can read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'accounting')
);

-- WORKERS
create table public.workers (
  id serial primary key,
  name text not null,
  company text not null check (company in ('Construction','Landscape')),
  crew text,
  wage numeric,
  ot_wage numeric,
  salary boolean default false,
  role text default 'worker',
  username text unique,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.workers enable row level security;
create policy "All authenticated can read workers" on public.workers for select using (auth.role() = 'authenticated');
create policy "Accounting and crew managers can insert workers" on public.workers for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('accounting','crew_manager'))
);
create policy "Accounting and crew managers can update workers" on public.workers for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('accounting','crew_manager'))
);

-- PROJECTS
create table public.projects (
  id serial primary key,
  name text not null unique,
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
create policy "All authenticated can read projects" on public.projects for select using (auth.role() = 'authenticated');
create policy "Accounting can manage projects" on public.projects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'accounting')
);

-- COST CODES
create table public.cost_codes (
  id serial primary key,
  code text not null unique,
  type text not null,
  description text,
  department text,
  active boolean default true
);
alter table public.cost_codes enable row level security;
create policy "All authenticated can read cost codes" on public.cost_codes for select using (auth.role() = 'authenticated');
create policy "Accounting can manage cost codes" on public.cost_codes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'accounting')
);

-- TIMESHEET ENTRIES
create table public.timesheet_entries (
  id uuid default gen_random_uuid() primary key,
  worker_id integer references public.workers(id),
  worker_name text not null,
  company text not null,
  crew text,
  date date not null,
  clock_in text,
  clock_out text,
  break_mins integer default 60,
  total_hours numeric default 0,
  ot_hours numeric default 0,
  project text,
  cost_code text,
  status text default 'submitted' check (status in ('clocked_in','submitted','pending_crew','approved','rejected')),
  wage numeric,
  ot_wage numeric,
  week_start date,
  submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.timesheet_entries enable row level security;

-- Workers can read their own entries
create policy "Workers read own entries" on public.timesheet_entries for select using (
  exists (select 1 from public.profiles where id = auth.uid() and worker_id = timesheet_entries.worker_id)
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('accounting','crew_manager'))
);
-- Workers can insert their own entries
create policy "Workers insert own entries" on public.timesheet_entries for insert with check (
  exists (select 1 from public.profiles p join public.workers w on p.worker_id = w.id where p.id = auth.uid() and w.id = worker_id)
  or exists (select 1 from public.profiles where id = auth.uid() and role in ('accounting','crew_manager'))
);
-- Crew managers can update their crew's entries
create policy "Crew managers update crew entries" on public.timesheet_entries for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('accounting','crew_manager'))
);

-- WAGES HISTORY
create table public.wage_history (
  id serial primary key,
  worker_id integer references public.workers(id),
  wage numeric,
  ot_wage numeric,
  effective_from date not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz default now()
);
alter table public.wage_history enable row level security;
create policy "Accounting manages wage history" on public.wage_history for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'accounting')
);

-- FUNCTION: auto update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger timesheet_updated_at before update on public.timesheet_entries
  for each row execute function update_updated_at();

-- ============================================
-- SEED: Insert all workers
-- ============================================
insert into public.workers (name, company, crew, wage, ot_wage, salary) values
('Adelmo Herrera','Construction','Omar',null,null,false),
('Alexis Morales','Construction','Waldo',16,24,false),
('Alfredo Martinez','Landscape','Moises',17,25.5,false),
('Andres Dorantes','Landscape','Wilson',15,22.5,false),
('Antonio Martinez','Landscape','Noel',17,25.5,false),
('Antonio Ruiz','Construction','Miscellaneous',null,null,false),
('Antonio Morales','Landscape','Noel',14,21,false),
('Axel Rodriguez','Landscape','Ricardo',14,21,false),
('Baldemar Ajpacaja Chiyal','Landscape','Erving',17,25.5,false),
('Brayan Lucero','Construction','Omar',null,null,false),
('Carlos Andrade','Landscape','Wilson',16,24,false),
('Carlos Hernandez','Construction','Jose L',23,34.5,false),
('Carlos Limon','Construction','Black',19,28.5,false),
('Carlos Lopez','Construction','Tony',null,null,false),
('Cesar Martinez','Landscape','Erving',17,25.5,false),
('Cesar Romero','Landscape','Cesear Old',null,null,false),
('Christian Rivera','Construction','Jairo',20,30,false),
('Delfino Gamez','Landscape','Defino',25,37.5,false),
('Douglas Coronado','Landscape','Defino',17,25.5,false),
('Erving Rojas Ruiz','Landscape','Erving',21,31.5,false),
('Eufemio Martinez','Landscape','Noel',17,25.5,false),
('Fernando Cortez','Construction','Marco',24,36,false),
('Gabino Galvan','Construction','Gambino',101400,0,true),
('Gabriel Delgado','Landscape','Moises',null,null,false),
('Gabriel Ruiz-Paramo','Construction','Black',21,31.5,false),
('Giovani Garcia','Construction','Jairo',18,27,false),
('Hector Calles','Construction','Marco',22,33,false),
('Henry Hernandez','Landscape','Moises',20,30,false),
('Hugo Herrera-Rivera','Construction','Hugo',25,37.5,false),
('Javier Figueroa','Construction','Waldo',21,31.5,false),
('Jeronimo Carbajal Arenas','Construction','Tony',18,27,false),
('Jesling Bravo','Landscape','Wilson',14.5,21.75,false),
('Jesus Cameras','Construction','Gambino',22,22,false),
('Jose Penaloza','Construction','Jose L',29,43.5,false),
('Jose Reyes','Construction','Miscellaneous',18,27,false),
('Jose Contreras','Construction','Jairo',18.5,27.75,false),
('Jose Delgadillo','Construction','Gambino',22,22,false),
('Jose Diaz','Landscape','Cesear Old',null,null,false),
('Jose Hernandez','Construction','Yard',18.5,27.75,false),
('Jose Munguia','Landscape','Wilson',18,27,false),
('Josue Maldonado','Landscape','Defino',14,21,false),
('Juan Alvarez','Construction','Tony',90000,null,true),
('Julio Martinez','Construction','Miscellaneous',20,30,false),
('Kennel Maradiaga','Construction','Martin',20.5,30.75,false),
('Kevin Davila','Construction','Omar',null,null,false),
('Kevin Manzanares','Landscape','Defino',18,27,false),
('Leroy III Nelson','Construction','Driver',20,30,false),
('Luis Delgadillo','Construction','Black',25,37.5,false),
('Luis Martinez','Landscape','Erving',17,25.5,false),
('Luis Castrejon','Construction','Marco',22,33,false),
('Luis Escalante','Construction','Martin',20,30,false),
('Luis Limon','Construction',null,101400,null,true),
('Luis Pavon Lopez','Construction','Black',24,36,false),
('Marco Gomez','Construction','Waldo',22,33,false),
('Marco Mandujano','Construction','Martin',20,30,false),
('Marco Vazquez Rodriguez','Construction','Marco',28.5,42.75,false),
('Martin Mendez','Construction','Martin',113200,0,true),
('Martin Morales','Landscape','Noel',16.5,24.75,false),
('Moises Torrez','Landscape','Moises',21,31.5,false),
('Moises Rivera','Construction','Miscellaneous',18,27,false),
('Nestor Lopez','Construction','Black',14,21,false),
('Nobel Lazo','Landscape','Nobel',24.5,36.75,false),
('Noel Morales','Landscape','Moises',17,25.5,false),
('Norlan Orozco','Construction','Gambino',22,22,false),
('Octavio Roman','Construction','Cesear',17,25.5,false),
('Omar Cortez','Construction','Omar',null,null,false),
('Oswaldo Chavez','Construction','Waldo',27,40.5,false),
('Pablo Urgate','Construction','Gambino',22,22,false),
('Patricio Gonzalez','Landscape',null,23,34.5,false),
('Pedro Maldonado','Construction','Black',18,27,false),
('Ricardo Pinzon','Landscape','Ricardo',18,27,false),
('Ronald Mendoza-Goitia','Construction','Jose L',23,34.5,false),
('Rony Hernandez','Construction','Martin',20.51,30.765,false),
('Rosendo De La Cruz','Landscape','Defino',16,24,false),
('Samuel Oliva Ramirez','Landscape','Erving',17,25.5,false),
('Santo Varela','Landscape','Defino',16.5,24.75,false),
('Santos Rodriguez','Landscape','Wilson',null,null,false),
('Ulber Pineda','Construction','Jairo',21,31.5,false),
('Uriel Mandujano','Construction','Yard',28,42,false),
('Victor Tipaz Yat','Landscape','Cesear',null,null,false),
('Victor Zacarias','Landscape','Cesear',16,24,false),
('Walter Perez','Construction','Jairo',23,34.5,false),
('Willie Cotton','Construction','Driver',21,31.5,false),
('Wilson Alonso','Landscape','Wilson',22,33,false),
('Yoandry Pelegrino','Construction','Martin',20,30,false),
('Julian Mantilla','Construction','Pavon',18,27,false),
('Yader Martinez','Landscape','Moises',null,null,false),
('Josue Aguirre Morales','Landscape','Moises',null,null,false);
