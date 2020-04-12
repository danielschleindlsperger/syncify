--users-can-join-rooms (up)
ALTER TABLE users
  ADD COLUMN room_id UUID REFERENCES rooms(id);
