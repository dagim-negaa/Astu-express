import { eq } from 'drizzle-orm';
import { getDb } from '../../db';
import {
  purchaseOrders,
  purchaseOrderItems,
  bankAccounts,
  financialTransactions,
  expenses,
  suppliers,
  warehouses,
  warehouseItems,
} from '../../db/schema';
import type { CreatePurchaseOrderInput, ReceivePurchaseOrderInput } from './purchases.types';

export class PurchaseRepository {
  private db: ReturnType<typeof getDb>;

  constructor(d1: any) {
    this.db = getDb(d1);
  }

  async findAll() {
    const orders = await this.db.select().from(purchaseOrders).all();
    const result = [];
    for (const order of orders) {
      const items = await this.db
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, order.id))
        .all();
      result.push({ ...order, items });
    }
    return result;
  }

  async findById(id: string) {
    const order = await this.db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id)).get();
    if (!order) return null;
    const items = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id))
      .all();
    return { ...order, items };
  }

  async create(data: CreatePurchaseOrderInput & { id: string }) {
    const now = new Date().toISOString();
    const totalAmount = data.items.reduce(
      (sum, item) => sum + (item.totalCostEtb || item.quantity * item.unitCostEtb),
      0
    );

    const isImmediateReceived = data.status === 'received';
    await this.db
      .insert(purchaseOrders)
      .values({
        id: data.id,
        supplierId: data.supplierId,
        warehouseId: data.warehouseId || 'wh-main',
        status: isImmediateReceived ? 'ordered' : (data.status || 'draft'),
        paymentStatus: data.paymentStatus || 'unpaid',
        accountId: data.accountId || null,
        totalAmountEtb: totalAmount,
        taxAmountEtb: data.taxAmountEtb || 0,
        shippingCostEtb: data.shippingCostEtb || 0,
        notes: data.notes || null,
        expectedDeliveryDate: data.expectedDeliveryDate || null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    for (const item of data.items) {
      const itemId = `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await this.db
        .insert(purchaseOrderItems)
        .values({
          id: itemId,
          purchaseOrderId: data.id,
          garmentId: item.garmentId || null,
          description: item.description || (item as any).itemTitle || (item as any).title || 'Stock Item',
          category: item.category || 'rtw',
          quantity: item.quantity,
          unitCostEtb: item.unitCostEtb,
          totalCostEtb: item.totalCostEtb || item.quantity * item.unitCostEtb,
        })
        .run();
    }

    if (isImmediateReceived) {
      return this.receive(data.id, {
        accountId: data.accountId || undefined,
        warehouseId: data.warehouseId || undefined,
      });
    }

    return this.findById(data.id);
  }

  async updateStatus(id: string, status: string) {
    const now = new Date().toISOString();
    const updates: any = { status, updatedAt: now };
    if (status === 'received') updates.receivedAt = now;
    await this.db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id)).run();
    return this.findById(id);
  }

  async receive(id: string, options?: ReceivePurchaseOrderInput) {
    const po = await this.findById(id);
    if (!po) throw new Error('Purchase order not found');
    if (po.status === 'received') {
      throw new Error(`Purchase order ${id} has already been received under GRN ${po.grnNumber || 'N/A'}`);
    }

    const now = new Date().toISOString();
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Resolve Target Bank Account & STRICT BALANCE CHECK
    const targetAccId = options?.accountId || po.accountId;
    let selectedAccount: any = null;

    if (targetAccId) {
      selectedAccount = await this.db.select().from(bankAccounts).where(eq(bankAccounts.id, targetAccId)).get();
    }
    if (!selectedAccount) {
      // Pick default bank account if none specified
      selectedAccount = await this.db.select().from(bankAccounts).where(eq(bankAccounts.isDefault, true)).get();
      if (!selectedAccount) {
        selectedAccount = (await this.db.select().from(bankAccounts).all())[0];
      }
    }

    if (!selectedAccount) {
      throw new Error('No bank account found in the system. Please configure an account in Finance first.');
    }

    const totalCost = Number(po.totalAmountEtb) || 0;
    if (selectedAccount.currentBalance < totalCost) {
      throw new Error(
        `Insufficient balance in ${selectedAccount.accountName} (${selectedAccount.bankName}). Available: ETB ${Number(
          selectedAccount.currentBalance || 0
        ).toLocaleString()}, Required: ETB ${totalCost.toLocaleString()}. Please deposit funds into this account or select another account.`
      );
    }

    // 2. Settle payment: Deduct from bank account
    const newBal = Math.round((selectedAccount.currentBalance - totalCost) * 100) / 100;
    await this.db
      .update(bankAccounts)
      .set({ currentBalance: newBal, updatedAt: now })
      .where(eq(bankAccounts.id, selectedAccount.id))
      .run();

    // 3. Record financial ledger transaction
    await this.db
      .insert(financialTransactions)
      .values({
        id: `txn-grn-${id}-${Date.now()}`,
        accountId: selectedAccount.id,
        type: 'supplier_payment',
        amountEtb: -totalCost,
        balanceAfter: newBal,
        description: `Supplier Procurement / GRN (${grnNumber}): Paid ETB ${totalCost.toLocaleString()} to supplier`,
        category: 'procurement',
        referenceId: id,
        date: now.split('T')[0],
        createdAt: now,
      })
      .run();

    // 4. Record ERP expense for financial reports & profit/loss tracking
    await this.db
      .insert(expenses)
      .values({
        id: `exp-grn-${id}-${Date.now()}`,
        category: 'supplies',
        description: `Procurement GRN (${grnNumber}) — Supplier ID: ${po.supplierId} (${po.items?.length || 0} line items)`,
        amountEtb: totalCost,
        date: now.split('T')[0],
        paymentMethod: selectedAccount.accountType === 'cash' ? 'cash' : 'bank_transfer',
        accountId: selectedAccount.id,
        reference: grnNumber,
        createdAt: now,
      })
      .run();

    // 5. Resolve Target Warehouse
    let targetWarehouseId = options?.warehouseId || po.warehouseId;
    if (!targetWarehouseId) {
      const defaultWh = await this.db.select().from(warehouses).where(eq(warehouses.isDefault, true)).get();
      targetWarehouseId = defaultWh?.id || 'wh-main';
    }

    // Fetch supplier name for inventory traceability
    const supplier = await this.db.select().from(suppliers).where(eq(suppliers.id, po.supplierId)).get();
    const supplierName = supplier?.name || 'Vendor';

    // 6. Store all received items into the Warehouse
    if (po.items && po.items.length > 0) {
      for (const item of po.items) {
        const whiId = `whi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const itemCost = Number(item.unitCostEtb) || 0;
        const itemQty = Number(item.quantity) || 1;
        const lineTotal = Number(item.totalCostEtb) || itemQty * itemCost;

        await this.db
          .insert(warehouseItems)
          .values({
            id: whiId,
            warehouseId: targetWarehouseId,
            purchaseOrderId: po.id,
            supplierId: po.supplierId,
            supplierName,
            grnNumber,
            itemTitle: item.description,
            category: item.category || 'rtw',
            quantity: itemQty, // Available in warehouse
            receivedQuantity: itemQty,
            transferredQuantity: 0,
            unitCostEtb: itemCost,
            totalCostEtb: lineTotal,
            status: 'in_warehouse',
            receivedAt: now,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    }

    // 7. Mark PO as received & paid
    const updates = {
      status: 'received',
      receivedAt: now,
      grnNumber,
      paymentStatus: 'paid',
      paidAt: now,
      accountId: selectedAccount.id,
      warehouseId: targetWarehouseId,
      updatedAt: now,
    };

    await this.db.update(purchaseOrders).set(updates).where(eq(purchaseOrders.id, id)).run();
    return this.findById(id);
  }

  async delete(id: string) {
    await this.db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id)).run();
    return this.db.delete(purchaseOrders).where(eq(purchaseOrders.id, id)).run();
  }
}
