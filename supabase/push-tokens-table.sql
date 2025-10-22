-- Create table for storing user push notification tokens
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one token per user per device type
  CONSTRAINT user_push_tokens_unique UNIQUE (user_id, device_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS user_push_tokens_user_id_idx ON public.user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS user_push_tokens_active_idx ON public.user_push_tokens(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own push tokens"
  ON public.user_push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
  ON public.user_push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push tokens"
  ON public.user_push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
  ON public.user_push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create table for notification history (optional - for tracking sent notifications)
CREATE TABLE IF NOT EXISTS public.notification_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT FALSE,
  
  -- For tracking related entities
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Create indexes for notification history
CREATE INDEX IF NOT EXISTS notification_history_user_id_idx ON public.notification_history(user_id);
CREATE INDEX IF NOT EXISTS notification_history_is_read_idx ON public.notification_history(is_read);
CREATE INDEX IF NOT EXISTS notification_history_sent_at_idx ON public.notification_history(sent_at DESC);

-- Enable RLS for notification history
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification history
CREATE POLICY "Users can view their own notifications"
  ON public.notification_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notification_history
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.user_push_tokens IS 'Stores push notification tokens for users devices';
COMMENT ON TABLE public.notification_history IS 'Tracks notification history for users';

