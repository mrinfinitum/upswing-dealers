import type { Dealer } from "@/types/dealer";
import { normalizeDealerRows } from "./normalize";
import { rawDealerRows } from "./source";

export interface DealerRepository {
  getAll(): Promise<Dealer[]>;
}

export class WorkbookDealerRepository implements DealerRepository {
  async getAll() {
    const { dealers } = normalizeDealerRows(rawDealerRows);
    return dealers.filter((dealer) => dealer.active !== false);
  }
}

export const dealerRepository: DealerRepository = new WorkbookDealerRepository();
