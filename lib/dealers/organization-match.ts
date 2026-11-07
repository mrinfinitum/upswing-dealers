// Suggests which dealer organization a new location (usually a website application) belongs to, so chain
// stores such as "GOLFTEC Omaha" join their existing organization instead of becoming a stray dealer.
// Pure functions: the admin pages load the organizations and pass them in.

export type OrganizationMatchCandidate = {
  id: string;
  name: string;
  locationCount: number;
  // Website and email domains already used by the organization's linked locations.
  domains: string[];
};

export type OrganizationMatch = {
  organization: OrganizationMatchCandidate;
  reason: string;
};

export type OrganizationMatchInput = {
  name: string;
  website?: string;
  email?: string;
  notes?: string;
};

// Shared hosts and mailbox providers say nothing about which company a location belongs to.
const GENERIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.ca", "hotmail.com", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "comcast.net", "att.net", "sbcglobal.net", "verizon.net",
  "shaw.ca", "rogers.com", "sympatico.ca", "telus.net", "protonmail.com", "proton.me",
  "facebook.com", "instagram.com", "linktr.ee", "google.com", "sites.google.com", "business.site",
  "wixsite.com", "squarespace.com", "shopify.com", "myshopify.com", "godaddysites.com",
]);

export function normalizeOrganizationName(name: string) {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function domainFromWebsite(website?: string | null) {
  if (!website) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : undefined;
  } catch {
    return undefined;
  }
}

export function domainFromEmail(email?: string | null) {
  const match = email?.trim().toLowerCase().match(/^[^\s@]+@([a-z0-9.-]+\.[a-z]{2,})$/);
  return match?.[1];
}

export function isGenericDomain(domain: string) {
  return GENERIC_DOMAINS.has(domain) || [...GENERIC_DOMAINS].some((generic) => domain.endsWith(`.${generic}`));
}

// Applications keep the applicant's email in the admin notes ("Contact email: …"), not in the public email field.
function contactEmailFromNotes(notes?: string) {
  return notes?.match(/^Contact email:\s*(\S+)/m)?.[1];
}

// Builds each organization's domain list from its locations, dropping generic hosts and any domain that more
// than one organization uses, because those cannot identify a single organization.
export function organizationDomains(locations: Array<{ organizationId: string; website?: string | null; email?: string | null }>) {
  const owners = new Map<string, Set<string>>();
  for (const location of locations) {
    for (const domain of [domainFromWebsite(location.website), domainFromEmail(location.email)]) {
      if (!domain || isGenericDomain(domain)) continue;
      owners.set(domain, (owners.get(domain) ?? new Set()).add(location.organizationId));
    }
  }
  const byOrganization = new Map<string, string[]>();
  for (const [domain, organizationIds] of owners) {
    if (organizationIds.size !== 1) continue;
    const [organizationId] = organizationIds;
    byOrganization.set(organizationId, [...(byOrganization.get(organizationId) ?? []), domain]);
  }
  return byOrganization;
}

export function matchOrganization(input: OrganizationMatchInput, organizations: OrganizationMatchCandidate[]): OrganizationMatch | null {
  const name = normalizeOrganizationName(input.name);
  if (name) {
    const exact = organizations.find((organization) => normalizeOrganizationName(organization.name) === name);
    if (exact) return { organization: exact, reason: `the dealer name matches “${exact.name}”` };

    // "GOLFTEC Omaha" starts with "GOLFTEC". The longest organization name wins, so "Golf Town Express" is
    // not filed under "Golf Town". Very short names are skipped because they match too much.
    const prefixed = organizations
      .map((organization) => ({ organization, normalized: normalizeOrganizationName(organization.name) }))
      .filter(({ normalized }) => normalized.length >= 4 && name.startsWith(`${normalized} `))
      .sort((left, right) => right.normalized.length - left.normalized.length)[0];
    if (prefixed) return { organization: prefixed.organization, reason: `the dealer name starts with “${prefixed.organization.name}”` };
  }

  const checks: Array<[string | undefined, string]> = [
    [domainFromWebsite(input.website), "website"],
    [domainFromEmail(input.email), "email"],
    [domainFromEmail(contactEmailFromNotes(input.notes)), "contact email"],
  ];
  for (const [domain, label] of checks) {
    if (!domain || isGenericDomain(domain)) continue;
    const organization = organizations.find((candidate) => candidate.domains.includes(domain));
    if (organization) return { organization, reason: `the ${label} domain ${domain} is used by its other locations` };
  }
  return null;
}
