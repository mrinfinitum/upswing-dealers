import { US_STATE_NAMES } from "@/lib/geo/us-states";

export const APPLICATION_SOURCE_WORKBOOK = "Website application";
export const APPLICATION_SOURCE_SHEET = "become-a-dealer";

export const CA_PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};

export const APPLICATION_COUNTRIES = { US: "United States", CA: "Canada" } as const;

export const BUSINESS_TYPES = {
  "golf-shop": "Golf retail shop",
  "pro-shop": "Pro shop / golf club",
  fitter: "Club fitter",
  "junior-academy": "Junior academy / instructor",
  online: "Online retailer",
  other: "Other",
} as const;

export type DealerApplicationValues = {
  businessName: string;
  businessType: string;
  website: string;
  storePhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  yearsInBusiness: string;
  message: string;
};

export type DealerApplication = {
  businessName: string;
  businessType: keyof typeof BUSINESS_TYPES;
  website?: string;
  storePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: (typeof APPLICATION_COUNTRIES)[keyof typeof APPLICATION_COUNTRIES];
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  yearsInBusiness?: string;
  message?: string;
};

const LIMITS: Partial<Record<keyof DealerApplicationValues, number>> = { message: 2000 };
const DEFAULT_LIMIT = 200;

export function readApplicationValues(formData: FormData): DealerApplicationValues {
  const read = (name: keyof DealerApplicationValues) => {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim().slice(0, LIMITS[name] ?? DEFAULT_LIMIT) : "";
  };
  return {
    businessName: read("businessName"),
    businessType: read("businessType"),
    website: read("website"),
    storePhone: read("storePhone"),
    addressLine1: read("addressLine1"),
    addressLine2: read("addressLine2"),
    city: read("city"),
    region: read("region").toUpperCase(),
    postalCode: read("postalCode").toUpperCase(),
    country: read("country").toUpperCase(),
    contactName: read("contactName"),
    contactEmail: read("contactEmail").toLowerCase(),
    contactPhone: read("contactPhone"),
    yearsInBusiness: read("yearsInBusiness"),
    message: read("message"),
  };
}

export function parseDealerApplication(values: DealerApplicationValues) {
  const errors: Partial<Record<keyof DealerApplicationValues, string>> = {};
  const required: Array<[keyof DealerApplicationValues, string]> = [
    ["businessName", "Enter your business name."],
    ["addressLine1", "Enter your street address."],
    ["city", "Enter your city."],
    ["postalCode", "Enter your ZIP or postal code."],
    ["contactName", "Enter a contact name."],
    ["contactEmail", "Enter a contact email."],
  ];
  for (const [field, message] of required) if (!values[field]) errors[field] = message;

  if (!(values.businessType in BUSINESS_TYPES)) errors.businessType = "Choose the type of business.";
  if (values.country !== "US" && values.country !== "CA") errors.country = "Choose the United States or Canada.";
  const regions = values.country === "CA" ? CA_PROVINCE_NAMES : US_STATE_NAMES;
  if (!(values.region in regions)) errors.region = values.country === "CA" ? "Choose a province or territory." : "Choose a state.";
  if (values.postalCode) {
    const validPostal = values.country === "CA" ? /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/ : /^\d{5}(-\d{4})?$/;
    if (!validPostal.test(values.postalCode)) errors.postalCode = values.country === "CA" ? "Use a postal code like K1A 0B1." : "Use a 5-digit ZIP code.";
  }
  if (values.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contactEmail)) errors.contactEmail = "Enter a valid email address.";

  let website: string | undefined;
  if (values.website) {
    try {
      const url = new URL(/^https?:\/\//i.test(values.website) ? values.website : `https://${values.website}`);
      if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) throw new Error();
      website = url.toString();
    } catch {
      errors.website = "Enter a valid website address.";
    }
  }

  if (Object.keys(errors).length) return { errors };

  const application: DealerApplication = {
    businessName: values.businessName,
    businessType: values.businessType as DealerApplication["businessType"],
    website,
    storePhone: values.storePhone || undefined,
    addressLine1: values.addressLine1,
    addressLine2: values.addressLine2 || undefined,
    city: values.city,
    region: values.region,
    postalCode: values.postalCode,
    country: APPLICATION_COUNTRIES[values.country as keyof typeof APPLICATION_COUNTRIES],
    contactName: values.contactName,
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone || undefined,
    yearsInBusiness: values.yearsInBusiness || undefined,
    message: values.message || undefined,
  };
  return { application, errors };
}

// Applicant contact details stay in admin-only notes so they never reach the public locator.
export function applicationNotes(application: DealerApplication, submittedAt: Date) {
  return [
    `Dealer application submitted ${submittedAt.toISOString()} via dealers.upswinggolf.com/become-a-dealer.`,
    `Contact name: ${application.contactName}`,
    `Contact email: ${application.contactEmail}`,
    application.contactPhone ? `Contact phone: ${application.contactPhone}` : "",
    `Business type: ${BUSINESS_TYPES[application.businessType]}`,
    application.yearsInBusiness ? `Years in business: ${application.yearsInBusiness}` : "",
    application.message ? `Message:\n${application.message}` : "",
  ].filter(Boolean).join("\n");
}

export function applicationFingerprint(parts: Array<string | null | undefined>) {
  return parts.map((part) => (part || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");
}
