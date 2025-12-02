-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to notify about new scholarships
CREATE OR REPLACE FUNCTION notify_new_scholarship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Only send notification if the scholarship is active and validated
  IF NEW.est_active = true AND NEW.est_validee = true THEN
    -- Call the edge function via pg_net
    SELECT net.http_post(
      url := 'https://soxgicvobtfnzfdybwjx.supabase.co/functions/v1/notify-new-scholarship',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveGdpY3ZvYnRmbnpmZHlid2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjMyOTksImV4cCI6MjA3NTkzOTI5OX0.Oh8BGpUrkaCAorKmdUYoa_UzeKNs6rrFQiGJS4He308"}'::jsonb,
      body := jsonb_build_object('record', row_to_json(NEW))
    ) INTO request_id;
    
    RAISE LOG 'New scholarship notification triggered for scholarship: %, request_id: %', NEW.titre, request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new scholarships
DROP TRIGGER IF EXISTS on_scholarship_created ON public.bourse;
CREATE TRIGGER on_scholarship_created
  AFTER INSERT ON public.bourse
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_scholarship();

-- Also trigger on updates when a scholarship becomes active/validated
DROP TRIGGER IF EXISTS on_scholarship_activated ON public.bourse;
CREATE TRIGGER on_scholarship_activated
  AFTER UPDATE ON public.bourse
  FOR EACH ROW
  WHEN (OLD.est_active = false AND NEW.est_active = true AND NEW.est_validee = true)
  EXECUTE FUNCTION notify_new_scholarship();