--users-can-join-rooms (down)
ALTER TABLE users
  DROP COLUMN IF EXISTS room_id;
