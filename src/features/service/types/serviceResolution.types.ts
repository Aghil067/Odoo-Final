/**
 * serviceResolution.types.ts
 * ─────────────────────────────────────────────────────────────
 * TypeScript definitions for Service Ticket Resolution & Closure in M08.
 */

import type { RepairOutcome } from './serviceTask.types';

export type ServiceResolutionStatus = 'pending_review' | 'resolved' | 'reopened' | 'closed';

export interface ServiceTicketResolution {
  finalDiagnosis: string;
  rootCause: string;
  workPerformed: string;
  partsReplacedDescription?: string;
  replacementSerialNumber?: string; // from M04 inventory
  repairOutcome: RepairOutcome;
  resolutionDate: string;
  technicianRemarks?: string;
  serviceManagerNotes?: string;
  customerConfirmed: boolean;
  customerFeedback?: string;
  customerRating?: number; // 1-5 stars
  resolvedBy: string;
  closedAt?: string;
  closedBy?: string;
  reopenReason?: string;
}

