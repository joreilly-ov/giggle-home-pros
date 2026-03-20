
-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL DEFAULT '',
  reviewer_id UUID DEFAULT auth.uid(),
  rating_quality SMALLINT NOT NULL CHECK (rating_quality BETWEEN 1 AND 5),
  rating_communication SMALLINT NOT NULL CHECK (rating_communication BETWEEN 1 AND 5),
  rating_cleanliness SMALLINT NOT NULL CHECK (rating_cleanliness BETWEEN 1 AND 5),
  overall NUMERIC(3,2) GENERATED ALWAYS AS (
    ROUND((rating_quality + rating_communication + rating_cleanliness)::numeric / 3, 2)
  ) STORED,
  comment TEXT,
  private_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert reviews
CREATE POLICY "reviews: insert authenticated"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

-- Anyone authenticated can read reviews (public feedback)
CREATE POLICY "reviews: select authenticated"
  ON public.reviews FOR SELECT TO authenticated
  USING (true);

-- Create visible_reviews view (excludes private_feedback)
CREATE OR REPLACE VIEW public.visible_reviews AS
  SELECT id, contractor_id, job_id, reviewer_id,
         rating_quality, rating_communication, rating_cleanliness,
         overall, comment, created_at
  FROM public.reviews;

GRANT SELECT ON public.visible_reviews TO authenticated;
