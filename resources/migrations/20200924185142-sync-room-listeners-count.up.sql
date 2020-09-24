create or replace function adjust_room_listeners_count() returns trigger language plpgsql as $$
begin
  -- check if user definitely rooms (either joined for the first time or left)
  if new.room_id is distinct from old.room_id then
    if old.room_id is not null then
      -- decrement listeners count of the room the user just left
      update
        rooms
      set
        listeners_count = listeners_count - 1
      where
        id = old.room_id;
    end if;
    if new.room_id is not null then
      -- increment listeners count of the room the user just joined
      update
        rooms
      set
        listeners_count = listeners_count + 1
      where
        id = new.room_id;
    end if;
  end if;
  return new;
end;
$$
--;;
create trigger user_room_changes
after update on users
for each row
execute procedure adjust_room_listeners_count();