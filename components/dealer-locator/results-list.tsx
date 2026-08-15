import type { DealerWithDistance } from "@/types/dealer";
import { DealerCard } from "./dealer-card";

type ResultsListProps = {
  dealers: DealerWithDistance[];
  selectedDealerId?: string;
  query: string;
  postalQuery: boolean;
  showAll: boolean;
  onSelectDealer: (dealerId: string) => void;
};

export function ResultsList({ dealers, selectedDealerId, query, postalQuery, showAll, onSelectDealer }: ResultsListProps) {
  if (dealers.length === 0) {
    return (
      <div className="locator-empty" role="status">
        <span aria-hidden="true">◎</span>
        <h3>No dealers found</h3>
        <p>{postalQuery
          ? "Postal codes are not included in the current dealer file. Try a city, state, or dealer name."
          : `We couldn’t find a current location matching “${query}.” Try a nearby city or state.`}</p>
      </div>
    );
  }
  return (
    <div className={`results-list${showAll ? " show-all" : ""}`} aria-label="Dealer search results">
      {dealers.map((dealer, index) => (
        <DealerCard key={dealer.id} dealer={dealer} index={index} selected={dealer.id === selectedDealerId} onSelect={onSelectDealer} />
      ))}
    </div>
  );
}
