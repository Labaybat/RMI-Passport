-- Create admin_activity_log table to track administrative actions
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id TEXT,
  ip_address TEXT,
  device_info TEXT,
  details JSONB,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Add RLS policies
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all activity logs
CREATE POLICY "Allow admins to view all activity logs" 
  ON public.admin_activity_log
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' OR role = 'staff'
    )
  );

-- Allow users to insert their own actions
CREATE POLICY "Allow users to insert their own actions" 
  ON public.admin_activity_log
  FOR INSERT 
  WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

-- Create an index for faster queries
CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_user_id ON public.admin_activity_log(user_id);
CREATE INDEX idx_admin_activity_log_action ON public.admin_activity_log(action);
