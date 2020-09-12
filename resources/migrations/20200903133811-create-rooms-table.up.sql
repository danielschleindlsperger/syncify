create table rooms(
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  cover_image text,
  publicly_listed boolean default false,
  playlist jsonb not null,
  -- we might actually model this as an n:m relationship in a separate table, for now this will suffice though
  admins jsonb default '[]'::jsonb,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);