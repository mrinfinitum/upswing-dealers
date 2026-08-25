import type { DealerWithDistance } from "@/types/dealer";
import { getDealerBrandAsset } from "@/lib/dealers/brand";

type DealerCardProps = {
  dealer: DealerWithDistance;
  index: number;
  selected: boolean;
  onSelect: (dealerId: string) => void;
};

export function DealerCard({ dealer, index, selected, onSelect }: DealerCardProps) {
  const dealerBrand = getDealerBrandAsset(dealer.name);
  const location = [dealer.city, dealer.stateProvince].filter(Boolean).join(", ");
  const directionsQuery = [dealer.name, dealer.addressLine1, dealer.addressLine2, dealer.city, dealer.stateProvince, dealer.postalCode, dealer.country].filter(Boolean).join(", ");
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(directionsQuery)}`;

  return (
    <article id={`dealer-${dealer.id}`} className={`dealer-card${selected ? " is-selected" : ""}`}>
      <button className="dealer-card__select" onClick={() => onSelect(dealer.id)} aria-label={`Show ${dealer.name} in ${dealer.city} on map`}>
        <span className="dealer-card__number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span>
          {dealerBrand ? <span className="dealer-card__brand">
            {/* Approved retailer artwork is intentionally served by the retailer until local brand assets are supplied. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={dealerBrand.inverted ? "is-inverted" : undefined} src={dealerBrand.src} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
            <span className="dealer-card__name dealer-card__name--supporting">{dealer.name}</span>
          </span> : <span className="dealer-card__name">{dealer.name}</span>}
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
    </article>
  );
}
