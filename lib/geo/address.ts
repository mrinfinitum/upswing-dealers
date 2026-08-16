import type { Dealer } from "@/types/dealer";

const normalize = (value: FormDataEntryValue | string | undefined) => String(value ?? "").trim().toLowerCase();

export function dealerAddressFingerprint(dealer: Dealer) {
  return [dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country]
    .map(normalize)
    .join("|");
}

export function formAddressFingerprint(formData: FormData) {
  return ["addressLine1", "addressLine2", "city", "stateProvince", "postalCode", "country"]
    .map((field) => normalize(formData.get(field) ?? undefined))
    .join("|");
}

export function formAddressQuery(formData: FormData) {
  return ["addressLine1", "addressLine2", "city", "stateProvince", "postalCode", "country"]
    .map((field) => String(formData.get(field) ?? "").trim())
    .filter(Boolean)
    .join(", ");
}
