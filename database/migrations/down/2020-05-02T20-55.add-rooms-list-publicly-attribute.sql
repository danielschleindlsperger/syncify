--add-rooms-list-publicly-attribute (down)
ALTER TABLE rooms
  DROP COLUMN IF EXISTS publicly_listed;
