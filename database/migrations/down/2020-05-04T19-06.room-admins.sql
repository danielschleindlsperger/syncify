--room-admins (down)
ALTER TABLE rooms
  DROP COLUMN IF EXISTS admins;
