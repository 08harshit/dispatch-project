-- Add notification preferences to profiles (email, push, urgentOnly).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "push": true, "urgentOnly": false}';

COMMENT ON COLUMN public.profiles.notification_preferences IS 'User notification settings: email, push, urgentOnly.';
