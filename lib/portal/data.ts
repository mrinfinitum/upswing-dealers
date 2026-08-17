import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DealerPortalLocation } from "@/types/portal";

type PortalLocationRow = {
  organization_id: string;
  organization_name: string;
  dealer_id: string;
  dealer_name: string;
  location_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  website: string | null;
  email: string | null;
  active: boolean;
};

export async function getDealerPortalLocations(): Promise<DealerPortalLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_dealer_portal_locations");
  if (error || !data) return [];

  return (data as PortalLocationRow[]).map((row) => ({
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    dealerId: row.dealer_id,
    dealerName: row.dealer_name,
    locationName: row.location_name || undefined,
    addressLine1: row.address_line_1 || undefined,
    addressLine2: row.address_line_2 || undefined,
    city: row.city,
    stateProvince: row.state_province || undefined,
    postalCode: row.postal_code || undefined,
    country: row.country,
    phone: row.phone || undefined,
    website: row.website || undefined,
    email: row.email || undefined,
    active: row.active,
  }));
}
