import type { Dealer, DealerEnrichmentProposal } from "@/types/dealer";

export type EnrichmentMergeResult = {
  dealers: Dealer[];
  ignored: DealerEnrichmentProposal[];
};

export function applyVerifiedEnrichments(
  dealers: Dealer[],
  proposals: DealerEnrichmentProposal[],
): EnrichmentMergeResult {
  const dealerIds = new Set(dealers.map((dealer) => dealer.id));
  const verifiedByDealer = new Map(
    proposals
      .filter((proposal) => proposal.verificationStatus === "verified")
      .map((proposal) => [proposal.dealerId, proposal]),
  );
  const ignored = proposals.filter(
    (proposal) => proposal.verificationStatus !== "verified" || !dealerIds.has(proposal.dealerId),
  );

  return {
    dealers: dealers.map((dealer) => {
      const enrichment = verifiedByDealer.get(dealer.id);
      if (!enrichment) return dealer;
      const { latitude, longitude, canonicalLocationName, ...fields } = enrichment.proposed;
      const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
      return {
        ...dealer,
        ...fields,
        ...(canonicalLocationName ? { locationName: canonicalLocationName } : {}),
        ...(hasCoordinates
          ? { coordinates: { latitude: latitude as number, longitude: longitude as number } }
          : {}),
        verificationStatus: enrichment.verificationStatus,
        enrichmentSources: enrichment.sources,
      };
    }),
    ignored,
  };
}

export function validateEnrichmentProposals(
  dealers: Dealer[],
  proposals: DealerEnrichmentProposal[],
): string[] {
  const dealerIds = new Set(dealers.map((dealer) => dealer.id));
  const seen = new Set<string>();
  const issues: string[] = [];

  for (const proposal of proposals) {
    if (!dealerIds.has(proposal.dealerId)) issues.push(`Unknown dealer ID: ${proposal.dealerId}`);
    if (seen.has(proposal.dealerId)) issues.push(`Duplicate proposal: ${proposal.dealerId}`);
    seen.add(proposal.dealerId);
    const hasLatitude = proposal.proposed.latitude !== undefined;
    const hasLongitude = proposal.proposed.longitude !== undefined;
    if (hasLatitude !== hasLongitude) issues.push(`Incomplete coordinates: ${proposal.dealerId}`);
    if (hasLatitude && (proposal.proposed.latitude! < -90 || proposal.proposed.latitude! > 90)) {
      issues.push(`Latitude out of range: ${proposal.dealerId}`);
    }
    if (hasLongitude && (proposal.proposed.longitude! < -180 || proposal.proposed.longitude! > 180)) {
      issues.push(`Longitude out of range: ${proposal.dealerId}`);
    }
    if (proposal.verificationStatus === "verified" && proposal.sources.length === 0) {
      issues.push(`Verified proposal has no source: ${proposal.dealerId}`);
    }
    if (proposal.verificationStatus === "verified") {
      const sourcedFields = new Set(proposal.sources.flatMap((source) => source.fields));
      for (const field of Object.keys(proposal.proposed) as Array<keyof typeof proposal.proposed>) {
        if (!sourcedFields.has(field)) issues.push(`Verified field ${field} has no source: ${proposal.dealerId}`);
      }
    }
  }

  for (const dealer of dealers) {
    if (!seen.has(dealer.id)) issues.push(`Missing classification: ${dealer.id}`);
  }

  return issues;
}
