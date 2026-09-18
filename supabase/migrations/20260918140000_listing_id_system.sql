-- Migration: Permanent Buzl Listing ID System
-- Date: 2026-09-18
-- Description: Adds listing_code to businesses with immutable constraints, sequence allocation, and backfill.

-- 1. Create the sequence with strict bounds (MAXVALUE 999999) and NO CYCLE
CREATE SEQUENCE IF NOT EXISTS public.business_listing_code_seq 
  START WITH 1 
  INCREMENT BY 1 
  NO MINVALUE 
  MAXVALUE 999999 
  NO CYCLE
  CACHE 1;

-- Grant permissions to authenticated users to use the sequence
GRANT USAGE ON SEQUENCE public.business_listing_code_seq TO authenticated, service_role;

-- 2. Add the column (initially nullable for backfill)
ALTER TABLE public.businesses
  ADD COLUMN listing_code text;

-- 3. Deterministic Backfill
-- Order existing listings by created_at ASC, id ASC to ensure predictable BZL-XXXXXX assignment.
WITH ordered_businesses AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) as row_num
  FROM public.businesses
)
UPDATE public.businesses b
SET listing_code = 'BZL-' || lpad(ob.row_num::text, 6, '0')
FROM ordered_businesses ob
WHERE b.id = ob.id AND b.listing_code IS NULL;

-- 4. Align Sequence
-- Ensure the sequence starts after the highest currently assigned ID
DO $$
DECLARE
  max_val bigint;
BEGIN
  SELECT MAX(substring(listing_code FROM 5)::bigint) INTO max_val FROM public.businesses;
  IF max_val IS NOT NULL THEN
    PERFORM setval('public.business_listing_code_seq', max_val, true);
  END IF;
END $$;

-- 5. Add Constraints & Defaults
-- Set NOT NULL
ALTER TABLE public.businesses
  ALTER COLUMN listing_code SET NOT NULL;

-- Add format constraint
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_listing_code_format_check
  CHECK (listing_code ~ '^BZL-[0-9]{6}$');

-- Add unique constraint/index
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_listing_code ON public.businesses(listing_code);
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_listing_code_key UNIQUE USING INDEX idx_businesses_listing_code;

-- Add default value for the column directly
ALTER TABLE public.businesses
  ALTER COLUMN listing_code SET DEFAULT ('BZL-' || lpad(nextval('public.business_listing_code_seq')::text, 6, '0'));

-- 6. Immutability & Auto-assignment Triggers

-- Trigger function for INSERT: Force sequence allocation and ignore any provided value
CREATE OR REPLACE FUNCTION public.businesses_listing_code_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Always overwrite with the sequence to prevent manual injection bypass
  NEW.listing_code := 'BZL-' || lpad(nextval('public.business_listing_code_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_listing_code_insert_trigger
  BEFORE INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.businesses_listing_code_insert();

-- Trigger function for UPDATE: Enforce strict immutability
CREATE OR REPLACE FUNCTION public.businesses_listing_code_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.listing_code IS DISTINCT FROM OLD.listing_code THEN
    RAISE EXCEPTION 'listing_code is immutable and cannot be modified';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER businesses_listing_code_update_trigger
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.businesses_listing_code_update();

-- Schema Cache Reload
NOTIFY pgrst, 'reload schema';
