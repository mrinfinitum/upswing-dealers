-- Update requests were removed from both the admin and dealer portals.
-- Applying this migration permanently removes any historical request rows.
drop table if exists public.dealer_location_change_requests;
