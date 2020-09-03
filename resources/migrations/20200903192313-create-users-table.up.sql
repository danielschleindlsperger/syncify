create table users(
  id varchar(255) primary key,
  name varchar(255) not null,
  avatar text,
  room_id uuid references rooms(id),
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);
