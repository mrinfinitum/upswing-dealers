export const portalPageKeys = ["dashboard", "locations", "brand"] as const;

export type PortalPageKey = (typeof portalPageKeys)[number];

export type DealerPortalMembership = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  pagePermissions: PortalPageKey[];
};

export type DealerPortalIdentity = {
  id: string;
  email: string;
  displayName?: string;
  memberships: DealerPortalMembership[];
  permissions: PortalPageKey[];
};

export type DealerPortalLocation = {
  organizationId: string;
  organizationName: string;
  dealerId: string;
  dealerName: string;
  locationName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  website?: string;
  email?: string;
  active: boolean;
};
