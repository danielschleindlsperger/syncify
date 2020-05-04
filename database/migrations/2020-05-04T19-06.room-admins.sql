--room-admins (up)
ALTER TABLE rooms
  -- we might actually model this as an n:m relationship in a separate table
  -- for now this will suffice though
  ADD COLUMN admins JSONB DEFAULT '[]'::jsonb;
