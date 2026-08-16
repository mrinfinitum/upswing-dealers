import type { DealerWithDistance } from "@/types/dealer";

type DealerCardProps = {
  dealer: DealerWithDistance;
  index: number;
  selected: boolean;
  onSelect: (dealerId: string) => void;
};

export function DealerCard({ dealer, index, selected, onSelect }: DealerCardProps) {
  const location = [dealer.city, dealer.stateProvince].filter(Boolean).join(", ");
  const directionsQuery = [dealer.name, dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`;

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
      <div className="dealer-card__actions">
        {dealer.phone && <a href={`tel:${dealer.phone}`}>Call</a>}
        {dealer.website && <a href={dealer.website}>Website</a>}
        <a href={directionsUrl} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  );
}
