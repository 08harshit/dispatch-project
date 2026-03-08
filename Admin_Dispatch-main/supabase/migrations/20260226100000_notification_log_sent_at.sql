-- Add sent_at to notification_log so the worker can mark rows as sent.
ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.notification_log.sent_at IS 'When the notification was sent (email); NULL = unsent.';
