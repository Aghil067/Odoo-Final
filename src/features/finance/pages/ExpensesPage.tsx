/**
 * ExpensesPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Master Business Expenses Ledger page in Module M09.
 */

import React, { useState, useEffect } from 'react';
import type { Expense, ExpenseFormData } from '../types/expense.types';
import { expenseService } from '../services/expenseService';
import { ExpenseTable } from '../components/ExpenseTable';
import { ExpenseFormModal } from '../components/ExpenseFormModal';

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await expenseService.list();
      setExpenses(res.data);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreate = async (formData: ExpenseFormData) => {
    await expenseService.create(formData);
    await loadExpenses();
  };

  const handleApprove = async (id: string) => {
    await expenseService.approve(id);
    await loadExpenses();
  };

  const handleReject = async (id: string, reason: string) => {
    await expenseService.reject(id, reason);
    await loadExpenses();
  };

  const handleMarkPaid = async (id: string) => {
    await expenseService.markAsPaid(id);
    await loadExpenses();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Expense Management</h1>
        <p className="text-xs text-slate-500">
          Record, approve, and track material purchases, subcontractor labour, equipment rentals, and operational overheads.
        </p>
      </div>

      <ExpenseTable
        expenses={expenses}
        isLoading={isLoading}
        onOpenCreate={() => setShowCreateModal(true)}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkPaid={handleMarkPaid}
        canApprove={true}
      />

      <ExpenseFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

