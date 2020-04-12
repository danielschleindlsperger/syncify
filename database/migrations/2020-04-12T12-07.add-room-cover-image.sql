--add-room-cover-image (up)
ALTER TABLE rooms
  ADD COLUMN cover_image TEXT;
