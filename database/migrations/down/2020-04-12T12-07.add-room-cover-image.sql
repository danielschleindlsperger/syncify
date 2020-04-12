--add-room-cover-image (down)
ALTER TABLE rooms
  DROP COLUMN IF EXISTS cover_image;
