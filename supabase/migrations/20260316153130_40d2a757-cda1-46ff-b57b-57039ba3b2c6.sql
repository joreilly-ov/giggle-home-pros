
ALTER TABLE public.contractors
  ADD COLUMN license_number text,
  ADD COLUMN insurance_details text,
  ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE TRIGGER set_contractors_updated_at
  BEFORE UPDATE ON public.contractors
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
