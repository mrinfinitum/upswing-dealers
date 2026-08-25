-- Dealer categories are not part of the dealer/location model.
alter table public.dealers
drop column if exists dealer_type;
