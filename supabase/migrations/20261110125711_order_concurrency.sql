-- Fail on conflicting existing sessions rather than guessing which session to close.
create unique index table_sessions_one_active_per_table
  on public.table_sessions(table_id) where status = 'active';
