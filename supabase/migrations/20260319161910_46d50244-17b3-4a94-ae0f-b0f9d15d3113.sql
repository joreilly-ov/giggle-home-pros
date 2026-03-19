-- Allow authenticated users to browse all contractors (public listing)
CREATE POLICY "contractors: public read for browsing"
ON public.contractors
FOR SELECT
TO authenticated
USING (true);