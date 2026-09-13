import { calculateProfitMargin } from "@astu/shared";
import type { CatalogRepository } from "./catalog.repository";
import type { Garment, CreateGarmentInput, CatalogFilter } from "./catalog.types";

export class CatalogService {
  constructor(private repo: CatalogRepository) {}

  async listProducts(filter?: CatalogFilter): Promise<Garment[]> {
    return this.repo.findAll(filter);
  }

  async getProduct(id: string): Promise<Garment | null> {
    return this.repo.findById(id);
  }

  async createProduct(input: CreateGarmentInput): Promise<Garment> {
    // 1. Calculate dynamic profit margin if buying price is supplied
    const price = input.priceEtb ?? input.price ?? 0;
    const buyingPrice = input.buyingPriceEtb ?? input.buyingPrice ?? null;
    let profitMargin = input.profitMargin ?? null;

    if (buyingPrice !== null && price > 0 && profitMargin === null) {
      profitMargin = calculateProfitMargin(price, buyingPrice);
    }

    // 2. Validate SKU
    const sku = (input.sku || "").trim();
    if (!sku) throw new Error("SKU is required");

    const existing = await this.repo.findBySku(sku);
    if (existing) {
      throw new Error(`A garment with SKU "${sku}" already exists.`);
    }

    return this.repo.create({
      ...input,
      sku,
      profitMargin,
    });
  }

  async updateStock(id: string, newStockQuantity: number, newInitialStock?: number): Promise<Garment> {
    const updated = await this.repo.updateStock(id, newStockQuantity, newInitialStock);
    if (!updated) throw new Error("Garment not found");
    return updated;
  }

  async toggleSpotlight(id: string, isFeaturedExplicit?: boolean): Promise<{ success: boolean; isFeatured: boolean; id: string }> {
    return this.repo.toggleSpotlight(id, isFeaturedExplicit);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async clearAllProducts(): Promise<boolean> {
    return this.repo.clearAll();
  }
}
