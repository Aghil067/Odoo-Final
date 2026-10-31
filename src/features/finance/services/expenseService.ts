/**
 * expenseService.ts
 * ─────────────────────────────────────────────────────────────
 * Master API service layer for Expense Management in Module M09.
 */

import type {
  Expense,
  ExpenseFormData,
  ExpenseStatus,
  ExpenseCategory,
} from '../types/expense.types';
import { MOCK_EXPENSES } from '../data/mockFinanceData';

let expensesStore: Expense[] = [...MOCK_EXPENSES];

export interface ExpenseFilters {
  search?: string;
  category?: ExpenseCategory | 'all';
  status?: ExpenseStatus | 'all';
  installationId?: string;
  startDate?: string;
  endDate?: string;
}

export const expenseService = {
  /**
   * List expenses with optional filtering.
   */
  async list(filters?: ExpenseFilters): Promise<{ data: Expense[]; total: number }> {
    let result = [...expensesStore];

    if (!filters) {
      return { data: result, total: result.length };
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.expenseReference.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.vendorOrPayee.toLowerCase().includes(q) ||
          (e.installationRef && e.installationRef.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== 'all') {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter((e) => e.status === filters.status);
    }

    if (filters.installationId) {
      result = result.filter((e) => e.installationId === filters.installationId);
    }

    if (filters.startDate) {
      result = result.filter((e) => e.expenseDate >= filters.startDate!);
    }

    if (filters.endDate) {
      result = result.filter((e) => e.expenseDate <= filters.endDate!);
    }

    return { data: result, total: result.length };
  },

  /**
   * Get single expense by ID.
   */
  async getById(id: string): Promise<Expense | null> {
    const found = expensesStore.find((e) => e.id === id || e.expenseReference === id);
    return found ? { ...found } : null;
  },

  /**
   * Record a new business expense.
   */
  async create(formData: ExpenseFormData, userRole = 'finance_officer'): Promise<Expense> {
    const nextNum = expensesStore.length + 17;
    const expenseReference = `EXP-2026-0${nextNum}`;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      expenseReference,
      category: formData.category,
      description: formData.description,
      amount: formData.amount,
      expenseDate: formData.expenseDate || new Date().toISOString().split('T')[0],
      installationId: formData.installationId,
      installationRef: formData.installationId ? 'INS-2026-002' : undefined,
      serviceTicketId: formData.serviceTicketId,
      vendorOrPayee: formData.vendorOrPayee,
      paymentMethod: formData.paymentMethod,
      receiptFileName: formData.receiptFileName,
      notes: formData.notes,
      status: formData.saveAsDraft
        ? 'draft'
        : userRole === 'admin' || userRole === 'finance_officer'
        ? 'approved'
        : 'submitted',
      submittedBy: 'Finance / Project Team',
      approvedBy:
        userRole === 'admin' || userRole === 'finance_officer'
          ? 'Finance Officer (SunPower)'
          : undefined,
      approvalDate:
        userRole === 'admin' || userRole === 'finance_officer'
          ? new Date().toISOString().split('T')[0]
          : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expensesStore.unshift(newExpense);
    return { ...newExpense };
  },

  /**
   * Approve an expense.
   */
  async approve(id: string): Promise<Expense> {
    const idx = expensesStore.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    const updated: Expense = {
      ...expensesStore[idx],
      status: 'approved',
      approvedBy: 'Finance Officer (SunPower)',
      approvalDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    expensesStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Reject an expense with justification note.
   */
  async reject(id: string, reason: string): Promise<Expense> {
    const idx = expensesStore.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    const updated: Expense = {
      ...expensesStore[idx],
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    };

    expensesStore[idx] = updated;
    return { ...updated };
  },

  /**
   * Mark an approved expense as paid.
   */
  async markAsPaid(id: string): Promise<Expense> {
    const idx = expensesStore.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Expense not found');

    const updated: Expense = {
      ...expensesStore[idx],
      status: 'paid',
      updatedAt: new Date().toISOString(),
    };

    expensesStore[idx] = updated;
    return { ...updated };
  },
};

