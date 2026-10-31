/**
 * issueService.ts
 * ─────────────────────────────────────────────────────────────
 * Stock Issues Service for M04.
 */

import type {
  StockIssue,
  StockIssueFormData,
  IssueStatus,
} from '../types/stock.types';
import { MOCK_ISSUES, MOCK_WAREHOUSES } from '../data/mockInventoryData';
import { stockService } from './stockService';

function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let _issuesStore: StockIssue[] = [...MOCK_ISSUES];
let _nextIssueId = _issuesStore.length + 1;

export const issueService = {
  async list(filters: { search?: string; status?: IssueStatus | ''; warehouseId?: string } = {}): Promise<{
    data: StockIssue[];
    total: number;
  }> {
    await delay();
    let results = [..._issuesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (i) =>
          i.issueNumber.toLowerCase().includes(q) ||
          i.issuedTo.toLowerCase().includes(q) ||
          (i.referenceId && i.referenceId.toLowerCase().includes(q))
      );
    }

    if (filters.status) {
      results = results.filter((i) => i.status === filters.status);
    }

    if (filters.warehouseId) {
      results = results.filter((i) => i.sourceWarehouseId === filters.warehouseId);
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      data: results,
      total: results.length,
    };
  },

  async getById(id: string): Promise<StockIssue | null> {
    await delay(150);
    return _issuesStore.find((i) => i.id === id || i.issueNumber === id) ?? null;
  },

  async create(data: StockIssueFormData, user = 'Current User'): Promise<StockIssue> {
    await delay(500);
    const id = `iss-${String(_nextIssueId).padStart(3, '0')}`;
    const issueNumber = `ISS-${String(_nextIssueId).padStart(4, '0')}`;
    _nextIssueId++;

    const wh = MOCK_WAREHOUSES.find((w) => w.id === data.sourceWarehouseId);
    const sourceWarehouseName = wh?.name ?? 'Designated Warehouse';

    const lines = data.lines.map((l, index) => ({
      ...l,
      id: `il-${Date.now()}-${index}`,
    }));

    const totalQuantity = lines.reduce((acc, curr) => acc + curr.quantityToIssue, 0);

    const issue: StockIssue = {
      ...data,
      id,
      issueNumber,
      sourceWarehouseName,
      status: data.status ?? 'issued',
      lines,
      totalItems: lines.length,
      totalQuantity,
      issuedBy: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    _issuesStore = [issue, ..._issuesStore];

    // Log movement if status is issued
    if (issue.status === 'issued') {
      for (const line of issue.lines) {
        await stockService.logMovement({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          movementType: 'issue',
          quantity: -line.quantityToIssue,
          uom: line.unit,
          sourceLocation: sourceWarehouseName,
          destinationLocation: `${issue.purpose}: ${issue.issuedTo}`,
          referenceNumber: issueNumber,
          performedBy: user,
          serialNumbers: line.selectedSerialNumbers,
        });
      }
    }

    return issue;
  },

  async updateStatus(id: string, status: IssueStatus): Promise<StockIssue> {
    await delay(300);
    const idx = _issuesStore.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Issue record not found');

    const updated: StockIssue = {
      ..._issuesStore[idx],
      status,
      updatedAt: new Date().toISOString(),
    };

    _issuesStore = [
      ..._issuesStore.slice(0, idx),
      updated,
      ..._issuesStore.slice(idx + 1),
    ];
    return updated;
  },
};

