-- Add read_at and dismissed_at to notification_log for dashboard alert read/dismiss support.
ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.notification_log.read_at IS 'When the alert was marked read in the dashboard.';
COMMENT ON COLUMN public.notification_log.dismissed_at IS 'When the alert was dismissed; NULL = still visible.';
