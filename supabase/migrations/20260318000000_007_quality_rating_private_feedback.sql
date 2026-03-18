-- Migration 007 — Align reviews schema with Quality/Communication/Cleanliness spec
-- and add private_feedback visible only to admins (service-role reads reviews directly).

-- ── 1. Rename / add sub-rating columns ─────────────────────────────────────

-- Rename the old accuracy column to quality if it exists; otherwise create it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating_accuracy'
  ) THEN
    ALTER TABLE public.reviews RENAME COLUMN rating_accuracy TO rating_quality;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating_quality'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN rating_quality SMALLINT NOT NULL DEFAULT 0 CHECK (rating_quality BETWEEN 1 AND 5);
  END IF;
END $$;

-- Ensure rating_communication exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating_communication'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN rating_communication SMALLINT NOT NULL DEFAULT 0 CHECK (rating_communication BETWEEN 1 AND 5);
  END IF;
END $$;

-- Ensure rating_cleanliness exists (replaces timeliness/value/professionalism)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'rating_cleanliness'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN rating_cleanliness SMALLINT NOT NULL DEFAULT 0 CHECK (rating_cleanliness BETWEEN 1 AND 5);
  END IF;
END $$;

-- ── 2. Rebuild GENERATED overall column ────────────────────────────────────

ALTER TABLE public.reviews DROP COLUMN IF EXISTS overall;
ALTER TABLE public.reviews
  ADD COLUMN overall NUMERIC(3,2) GENERATED ALWAYS AS (
    ROUND((rating_quality + rating_communication + rating_cleanliness)::numeric / 3, 2)
  ) STORED;

-- ── 3. Add private_feedback ─────────────────────────────────────────────────

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS private_feedback TEXT;

-- ── 4. visible_reviews view — tradesman-safe, excludes private_feedback ─────

DROP VIEW IF EXISTS public.visible_reviews;
CREATE VIEW public.visible_reviews AS
  SELECT
    id,
    contractor_id,
    job_id,
    reviewer_id,
    rating_quality,
    rating_communication,
    rating_cleanliness,
    overall,
    comment,
    created_at
  FROM public.reviews;

-- Grant SELECT on the view to authenticated role
GRANT SELECT ON public.visible_reviews TO authenticated;
