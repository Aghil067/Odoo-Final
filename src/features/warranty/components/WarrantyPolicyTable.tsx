/**
 * WarrantyPolicyTable.tsx
 * ─────────────────────────────────────────────────────────────
 * Interactive table for Warranty Policies in M07.
 */

import React, { useState } from 'react';
import { Search, Shield, Plus, Power, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WarrantyPolicy, PolicyStatus } from '../types/warrantyPolicy.types';
import {
  COVERAGE_TYPE_LABELS,
  COVERAGE_TYPE_COLOURS,
  ACTIVATION_BASIS_LABELS,
  POLICY_STATUS_LABELS,
  POLICY_STATUS_COLOURS,
} from '../types/warrantyPolicy.types';

interface WarrantyPolicyTableProps {
  policies: WarrantyPolicy[];
  onToggleStatus: (id: string, newStatus: PolicyStatus) => Promise<void>;
  isLoading?: boolean;
}

export const WarrantyPolicyTable: React.FC<WarrantyPolicyTableProps> = ({
  policies,
  onToggleStatus,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<WarrantyPolicy | null>(null);

  const filtered = policies.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.policyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.policyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.policyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || p.productCategory === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCoverage = coverageFilter === 'all' || p.coverageType === coverageFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesCoverage;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policy name, code, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="solar_panels">Solar Panels</option>
            <option value="inverter">Inverters</option>
            <option value="battery">Batteries</option>
            <option value="charge_controller">Charge Controllers</option>
          </select>

          {/* Coverage Type Filter */}
          <select
            value={coverageFilter}
            onChange={(e) => setCoverageFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Coverage</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="company">Company</option>
            <option value="extended">Extended</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>

          <Link
            to="/warranty/policies/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </Link>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Policy ID & Name</th>
                <th className="px-4 py-3">Category & Equipment</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Coverage Type</th>
                <th className="px-4 py-3">Activation Basis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Loading policies catalogue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No warranty policies match your search filters.
                  </td>
                </tr>
              ) : (
                filtered.map((policy) => {
                  const coverageCfg = COVERAGE_TYPE_COLOURS[policy.coverageType] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };
                  const statusCfg = POLICY_STATUS_COLOURS[policy.status] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-600',
                    border: 'border-slate-300',
                  };

                  return (
                    <tr key={policy.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{policy.policyName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {policy.policyId} • {policy.policyCode}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="capitalize font-medium text-slate-800">
                          {policy.productCategory.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          {policy.applicableProductName || policy.manufacturer}
                          {policy.modelNumber ? ` (${policy.modelNumber})` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <span className="inline-flex items-center gap-1 text-slate-800 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {policy.durationValue} {policy.durationUnit}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full border text-[11px] font-medium ${coverageCfg.bg} ${coverageCfg.text} ${coverageCfg.border}`}
                        >
                          {COVERAGE_TYPE_LABELS[policy.coverageType] || policy.coverageType}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-700">
                          {ACTIVATION_BASIS_LABELS[policy.activationBasis] || policy.activationBasis}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {POLICY_STATUS_LABELS[policy.status] || policy.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPolicy(policy)}
                            className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleStatus(
                                policy.id,
                                policy.status === 'active' ? 'inactive' : 'active'
                              )
                            }
                            className={`p-1.5 rounded transition-colors ${
                              policy.status === 'active'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={policy.status === 'active' ? 'Deactivate policy' : 'Activate policy'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Details Quick View Modal */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-xs font-mono text-green-600 uppercase font-semibold">
                  {selectedPolicy.policyId}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedPolicy.policyName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Product Category</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {selectedPolicy.productCategory.replace('_', ' ')}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Duration</span>
                <span className="font-semibold text-slate-800">
                  {selectedPolicy.durationValue} {selectedPolicy.durationUnit}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Coverage Type</span>
                <span className="font-semibold text-slate-800">
                  {COVERAGE_TYPE_LABELS[selectedPolicy.coverageType]}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Activation Basis</span>
                <span className="font-semibold text-slate-800">
                  {ACTIVATION_BASIS_LABELS[selectedPolicy.activationBasis]}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Manufacturer</span>
                <span className="font-semibold text-slate-800">{selectedPolicy.manufacturer}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Policy Status</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {selectedPolicy.status}
                </span>
              </div>
            </div>

            {/* Coverage Rules Checklist */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h4 className="text-xs font-semibold text-slate-800 mb-2">Policy Enforcement Rules</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.isTransferable ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Transferable: {selectedPolicy.isTransferable ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.isProofOfPurchaseRequired ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Proof of Purchase: {selectedPolicy.isProofOfPurchaseRequired ? 'Mandatory' : 'Optional'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.isSerialNumberMandatory ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Serial Mandatory: {selectedPolicy.isSerialNumberMandatory ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.isInstallationProofRequired ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Installation Proof: {selectedPolicy.isInstallationProofRequired ? 'Required' : 'Optional'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.coversReplacement ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Covers Replacement: {selectedPolicy.coversReplacement ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle
                    className={`w-3.5 h-3.5 ${
                      selectedPolicy.coversRepair ? 'text-green-600' : 'text-slate-300'
                    }`}
                  />
                  <span>Covers Repair: {selectedPolicy.coversRepair ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Description & Exclusions */}
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-slate-800">Coverage Inclusions:</span>
                <p className="text-slate-600 mt-0.5">{selectedPolicy.coverageDescription}</p>
              </div>
              <div>
                <span className="font-semibold text-slate-800">Exclusions:</span>
                <p className="text-slate-600 mt-0.5">{selectedPolicy.exclusions}</p>
              </div>
              {selectedPolicy.termsAndConditions && (
                <div>
                  <span className="font-semibold text-slate-800">Terms & Conditions:</span>
                  <p className="text-slate-600 mt-0.5">{selectedPolicy.termsAndConditions}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedPolicy(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
