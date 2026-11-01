/**
 * src/features/crm/components/EnquiryPipeline.tsx
 * Visual sales pipeline stage indicator and pipeline summary.
 */
import { Check } from 'lucide-react';
import { PIPELINE_STAGES, ENQUIRY_STATUS_LABELS, CRM_LEAD_TRANSITIONS, type EnquiryStatus } from '../types/enquiry.types';

interface EnquiryPipelineProps {
  currentStatus: EnquiryStatus;
  onStatusChange?: (newStatus: EnquiryStatus) => void;
  disabled?: boolean;
}

export function EnquiryPipeline({ currentStatus, onStatusChange, disabled }: EnquiryPipelineProps) {
  if (currentStatus === 'lost'||currentStatus==='disqualified') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center justify-between">
        <span className="font-semibold">Pipeline Status: {ENQUIRY_STATUS_LABELS[currentStatus]}</span>
        {onStatusChange && !disabled && (
          <button
            onClick={() => onStatusChange('contacted')}
            className="text-xs text-red-700 underline font-medium hover:text-red-800"
          >
            Re-open Enquiry
          </button>
        )}
      </div>
    );
  }

  const currentIndex = PIPELINE_STAGES.indexOf(currentStatus);

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-[700px]">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <div key={stage} className="flex-1 flex items-center last:flex-none">
              <button
                type="button"
                disabled={disabled || !onStatusChange || !(CRM_LEAD_TRANSITIONS[currentStatus]??[]).includes(stage)}
                onClick={() => onStatusChange && onStatusChange(stage)}
                className={`flex flex-col items-center group focus:outline-none ${
                  disabled || !onStatusChange ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                      ? 'bg-green-100 border-2 border-green-600 text-green-700 font-bold scale-110 shadow-sm'
                      : 'bg-slate-100 border border-slate-300 text-slate-400 group-hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] mt-1 whitespace-nowrap text-center ${
                    isCurrent
                      ? 'font-bold text-green-700'
                      : isCompleted
                      ? 'font-medium text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {ENQUIRY_STATUS_LABELS[stage]}
                </span>
              </button>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${
                    currentIndex > idx ? 'bg-green-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

