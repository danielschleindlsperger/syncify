--add-rooms-list-publicly-attribute (up)
ALTER TABLE rooms
  ADD COLUMN publicly_listed BOOLEAN DEFAULT false;
