import type { StoreRepository } from "./stores.repository";
import type { StoreLocation, CreateStoreInput } from "@astu/shared";

export class StoreService {
  constructor(private repo: StoreRepository) {}

  async listStores(): Promise<StoreLocation[]> {
    return this.repo.findAll();
  }

  async createStore(input: CreateStoreInput): Promise<StoreLocation> {
    return this.repo.create(input);
  }

  async updateStore(id: string, input: Partial<CreateStoreInput>): Promise<StoreLocation | null> {
    return this.repo.update(id, input);
  }

  async deleteStore(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }
}
