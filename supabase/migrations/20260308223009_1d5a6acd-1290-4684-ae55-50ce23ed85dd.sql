
-- Allow admins to read ALL ads (including inactive)
CREATE POLICY "Admins can read all ads" ON public.ad_placements
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
