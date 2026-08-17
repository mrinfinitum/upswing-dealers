import type { DealerWithDistance } from "@/types/dealer";

type DealerCardProps = {
  dealer: DealerWithDistance;
  index: number;
  selected: boolean;
  onSelect: (dealerId: string) => void;
};

function getWebsiteLabel(website: string) {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

export function DealerCard({ dealer, index, selected, onSelect }: DealerCardProps) {
  const location = [dealer.city, dealer.stateProvince].filter(Boolean).join(", ");
  const directionsQuery = [dealer.name, dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`;
  const locationName = dealer.locationName !== dealer.name ? dealer.locationName : undefined;
  const hasMoreInfo = Boolean(locationName || dealer.phone || dealer.website || dealer.email || dealer.dealerType || dealer.notes);

  return (
    <article id={`dealer-${dealer.id}`} className={`dealer-card${selected ? " is-selected" : ""}`}>
      <button className="dealer-card__select" onClick={() => onSelect(dealer.id)} aria-label={`Show ${dealer.name} in ${dealer.city} on map`}>
        <span className="dealer-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span>
          <span className="dealer-card__name">{dealer.name}</span>
          {dealer.addressLine1 && <span className="dealer-card__address">{dealer.addressLine1}{dealer.addressLine2 ? `, ${dealer.addressLine2}` : ""}</span>}
          <span className="dealer-card__location">{location}</span>
          {dealer.postalCode && <span className="dealer-card__postal">{dealer.postalCode}</span>}
          {dealer.country !== "United States" && <span className="dealer-card__country">{dealer.country}</span>}
          {dealer.distanceMiles !== undefined && <span className="dealer-card__distance">{dealer.distanceMiles.toFixed(1)} miles away</span>}
        </span>
      </button>
      {dealer.phone && (
        <a className="dealer-card__phone" href={`tel:${dealer.phone}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.68 2.8a2 2 0 0 1-.45 2.11L8.07 9.91a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.9.32 1.84.55 2.8.68A2 2 0 0 1 22 16.92Z" /></svg>
          {dealer.phone}
        </a>
      )}
      <div className="dealer-card__actions">
        {dealer.phone && <a href={`tel:${dealer.phone}`}>Call</a>}
        {dealer.website && <a href={dealer.website}>Website</a>}
        <a href={directionsUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
      </div>
      {hasMoreInfo && (
        <details className="dealer-card__details">
          <summary>More info <span aria-hidden="true">+</span></summary>
          <dl>
            {locationName && <div><dt>Location</dt><dd>{locationName}</dd></div>}
            {dealer.dealerType && <div><dt>Dealer type</dt><dd>{dealer.dealerType}</dd></div>}
            {dealer.phone && <div><dt>Phone</dt><dd><a href={`tel:${dealer.phone}`}>{dealer.phone}</a></dd></div>}
            {dealer.website && <div><dt>Website</dt><dd><a href={dealer.website}>{getWebsiteLabel(dealer.website)} <span aria-hidden="true">↗</span></a></dd></div>}
            {dealer.email && <div><dt>Email</dt><dd><a href={`mailto:${dealer.email}`}>{dealer.email}</a></dd></div>}
            {dealer.notes && <div><dt>Notes</dt><dd>{dealer.notes}</dd></div>}
          </dl>
        </details>
      )}
    </article>
  );
}
