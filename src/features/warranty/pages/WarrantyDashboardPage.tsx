/**
 * WarrantyDashboardPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Executive Warranty Dashboard for M07: Warranty Management.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Info,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import type { WarrantyRecord, WarrantyDashboardMetrics } from '../types/warranty.types';
import type { WarrantyClaim } from '../types/warrantyClaim.types';
import { warrantyService } from '../services/warrantyService';
import { warrantyClaimService } from '../services/warrantyClaimService';
import { WarrantyStatusBadge } from '../components/WarrantyStatusBadge';
import { ClaimStatusBadge } from '../components/ClaimStatusBadge';
import { formatRemainingCoverage } from '../components/WarrantyTable';

export const WarrantyDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<WarrantyDashboardMetrics | null>(null);
  const [recentWarranties, setRecentWarranties] = useState<WarrantyRecord[]>([]);
  const [expiringWarranties, setExpiringWarranties] = useState<WarrantyRecord[]>([]);
  const [pendingClaims, setPendingClaims] = useState<WarrantyClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [mRes, wRes, expRes, cRes] = await Promise.all([
          warrantyService.getDashboardMetrics(),
          warrantyService.list(),
          warrantyService.getExpiring(60),
          warrantyClaimService.list(),
        ]);

        setMetrics(mRes);
        setRecentWarranties((wRes.data || []).slice(0, 5));
        setExpiringWarranties(expRes.slice(0, 5));
        setPendingClaims(
          (cRes.data || [])
            .filter((c) => c.status === 'submitted' || c.status === 'under_review')
            .slice(0, 5)
        );
      } catch (err) {
        console.error('Failed to load warranty dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-xs text-slate-400">
        Loading warranty operations dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Warranty Management Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time tracking of equipment coverage, policy enforcement, expiry countdowns, and claims resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/warranty/expiring"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 text-xs font-semibold rounded-lg transition-colors"
          >
            <Clock className="w-4 h-4" />
            Expiring Soon ({metrics?.expiringSoonCount || 0})
          </Link>
          <Link
            to="/warranty/claims/new"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-semibold rounded-lg transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            File Claim
          </Link>
          <Link
            to="/warranty/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Warranty
          </Link>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Demonstration Dataset:</span> Warranty statistics and telemetry displayed here represent initial simulated field dispatches for SunPower Solutions. Warranty start/expiry dates are linked to M04 inventory serials and M05 installation sign-offs.
        </p>
      </div>

      {/* 6 Key Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Registered */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Warranties
            </span>
            <Shield className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.totalRegistered || 0}</div>
          <div className="text-[11px] text-slate-400">Equipment registered</div>
        </div>

        {/* Active Warranties */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1 bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Active Coverage
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{metrics?.activeCount || 0}</div>
          <div className="text-[11px] text-emerald-600 font-medium">Valid field warranties</div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-sm space-y-1 bg-orange-50/20">
          <div className="flex items-center justify-between text-orange-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
              Expiring Soon
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{metrics?.expiringSoonCount || 0}</div>
          <div className="text-[11px] text-orange-600 font-medium">&lt; 30-60 days left</div>
        </div>

        {/* Expired Warranties */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm space-y-1 bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              Expired
            </span>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{metrics?.expiredCount || 0}</div>
          <div className="text-[11px] text-rose-500 font-medium">Eligible for AMC</div>
        </div>

        {/* Pending Claims */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-1 bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Pending Claims
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{metrics?.pendingClaimsCount || 0}</div>
          <div className="text-[11px] text-amber-600 font-medium">Under supervisor review</div>
        </div>

        {/* Approved Claims */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-green-600">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Approved Claims
            </span>
            <FileCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.approvedClaimsCount || 0}</div>
          <div className="text-[11px] text-slate-400">Repair / replacement</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Pending Claims & Expiring Soon */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Warranty Claims */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Warranty Claims Awaiting Supervisor Review
                </h3>
                <p className="text-xs text-slate-500">Claims submitted by customers or field technicians.</p>
              </div>
              <Link
                to="/warranty/claims"
                className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {pendingClaims.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">No pending claims under review.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingClaims.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">{c.claimId}</span>
                        <ClaimStatusBadge status={c.status} size="sm" />
                        <span className="text-[11px] text-slate-400 font-mono">{c.claimDate}</span>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{c.issueTitle}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.customerName} • {c.productName} (SN: {c.serialNumber || 'N/A'})
                      </p>
                    </div>

                    <Link
                      to={`/warranty/claims/${c.id}`}
                      className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors shrink-0"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Warranties Nearing Expiry */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Warranties Nearing Expiry (&lt; 60 Days)
                  </h3>
                  <p className="text-xs text-slate-500">Proactively contact customers for warranty renewals or AMC.</p>
                </div>
                <Link
                  to="/warranty/expiring"
                  className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View Roster <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {expiringWarranties.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No equipment nearing expiry in next 60 days.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {expiringWarranties.map((w) => {
                    const info = formatRemainingCoverage(w.warrantyExpiryDate, w.status);
                    return (
                      <div key={w.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{w.warrantyId}</span>
                            <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded text-[11px]">
                              {info.text}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800">{w.productName}</p>
                          <p className="text-[11px] text-slate-500">
                            {w.customerName} • Exp: {w.warrantyExpiryDate}
                          </p>
                        </div>

                        <Link
                          to={`/warranty/${w.id}`}
                          className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 font-medium"
                        >
                          Details
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recently Registered Warranties */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Recently Registered & Activated Equipment
                  </h3>
                  <p className="text-xs text-slate-500">Equipment warranties registered under SunPower installation projects.</p>
                </div>
                <Link
                  to="/warranty/records"
                  className="text-xs text-green-600 font-semibold hover:underline flex items-center gap-1"
                >
                  View Ledger <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentWarranties.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No warranties registered yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentWarranties.map((w) => (
                    <div key={w.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 font-mono">{w.warrantyId}</span>
                          <WarrantyStatusBadge status={w.status} size="sm" />
                        </div>
                        <p className="font-medium text-slate-800">{w.productName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          SN: {w.serialNumber || 'Batch'} • Customer: {w.customerName}
                        </p>
                      </div>

                      <Link
                        to={`/warranty/${w.id}`}
                        className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors shrink-0 font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>

        {/* Right Column (1 Col): Hardware Category Distribution & Policies */}
        <div className="space-y-6">
          {/* Distribution by Category */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-green-600" />
              Coverage by Hardware Category
            </h3>

            <div className="space-y-3">
              {(metrics?.categoryDistribution || []).map((cat) => (
                <div key={cat.category} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="capitalize text-slate-800">{cat.category.replace('_', ' ')}</span>
                    <span className="text-slate-500">
                      {cat.activeCount} active / {cat.count} total
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${cat.count > 0 ? (cat.activeCount / cat.count) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Navigation to Catalogue & Policies */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Warranty Management Shortcuts
            </h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/warranty/policies"
                className="p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">Warranty Policies Catalogue</p>
                  <p className="text-[11px] text-slate-500">Define manufacturer durations & terms</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/warranty/records"
                className="p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">Active Warranties Ledger</p>
                  <p className="text-[11px] text-slate-500">Search by serial number or customer</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/warranty/claims"
                className="p-3 rounded-lg border border-slate-200 hover:border-green-400 hover:bg-green-50/30 flex items-center justify-between text-slate-800 transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900">Warranty Claims Desk</p>
                  <p className="text-[11px] text-slate-500">Approve repairs & inventory replacements</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
