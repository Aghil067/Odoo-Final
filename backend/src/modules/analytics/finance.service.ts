import type { Prisma, FinanceInvoice, FinanceInvoiceStatus, FinanceQuoteStatus, FinancePaymentStatus, FinanceApprovalStatus } from '@prisma/client';
import { invoiceBalances } from '../finance/balances.js';
import { dec, sum } from '../finance/money.js';
import { expenseScope } from '../finance/read.service.js';
import { financeCustomerWhere, financeOrderWhere, financeQuoteWhere, requireDepartment } from './access.service.js';
import { type Context, range, bounded, page, paging, LIMIT } from './common.js';
async function balancesAt(c: Context, invoices: FinanceInvoice[]) {
    const rows = await invoiceBalances(c.tx, invoices);
    return rows.map(r => ({ ...r, asOf: c.asOf, effectiveStatus: r.invoice.status === 'ISSUED' && r.outstanding.gt('0') ? (r.invoice.dueAt < c.asOf ? 'OVERDUE' : r.allocatedAmount.gt('0') ? 'PARTIALLY_PAID' : 'ISSUED') : r.effectiveStatus }));
}
function invoiceWhere(c: Context): Prisma.FinanceInvoiceWhereInput { return { order: financeOrderWhere(c), currency: c.q.currency, status: 'ISSUED', issuedAt: range(c) }; }
function expenseWhere(c: Context): Prisma.FinanceExpenseWhereInput { return { AND: [expenseScope(c.user, c.q.customerId), { currency: c.q.currency, installationId: c.q.installationId, ...(c.q.siteId ? { installation: { siteId: c.q.siteId } } : {}) }] }; }
export async function invoiceBook(c: Context, receivables = false) {
    requireDepartment(c, 'finance');
    const where = receivables ? invoiceWhere(c) : { order: financeOrderWhere(c), currency: c.q.currency, status: c.q.status as FinanceInvoiceStatus | undefined, createdAt: range(c) };
    const rows = await c.tx.financeInvoice.findMany({ where, ...paging(c.q), orderBy: receivables ? [{ dueAt: 'asc' }, { id: 'asc' }] : [{ createdAt: 'desc' }, { id: 'asc' }] });
    return { ...page(await balancesAt(c, rows), await c.tx.financeInvoice.count({ where }), c.q), source: 'FinanceInvoice,FinanceCreditNote,FinancePaymentAllocation,FinanceAllocationRelease', definition: receivables ? 'Issued-in-interval invoice book, includes zero balances; outstanding is current snapshot after issued credits and active verified allocations, not historical as-of-to' : 'Invoice creation cohort with current M09 calculated balances; status filter uses persisted DRAFT/ISSUED/VOIDED', asOf: c.asOf };
}
export async function quotations(c: Context) {
    requireDepartment(c, 'finance');
    const where = { AND: [financeQuoteWhere(c), { createdAt: range(c), status: c.q.status as FinanceQuoteStatus | undefined }] };
    return { byCurrencyAndStatus: await c.tx.financeQuotation.groupBy({ by: ['currency', 'status'], where, _sum: { totalAmount: true, taxableAmount: true }, _count: { _all: true }, orderBy: [{ currency: 'asc' }, { status: 'asc' }] }), source: 'FinanceQuotation', definition: 'Current revision rows created in interval; SUPERSEDED listed separately, do not sum all revisions as pipeline. DRAFT/SUBMITTED_FOR_APPROVAL/APPROVED/SENT pipeline requires validUntil>asOf.', livePipeline: await c.tx.financeQuotation.groupBy({ by: ['currency'], where: { AND: [where, { status: { in: ['DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'SENT'] }, validUntil: { gt: c.asOf } }] }, _sum: { totalAmount: true }, _count: { _all: true }, orderBy: { currency: 'asc' } }) };
}
export async function payments(c: Context) {
    requireDepartment(c, 'finance');
    const where = { customer: financeCustomerWhere(c), currency: c.q.currency, paidAt: range(c), status: c.q.status as FinancePaymentStatus | undefined };
    return { byCurrencyAndStatus: await c.tx.financePayment.groupBy({ by: ['currency', 'status'], where, _sum: { amount: true }, _count: { _all: true }, orderBy: [{ currency: 'asc' }, { status: 'asc' }] }), completedRefunds: await c.tx.financeRefund.groupBy({ by: ['currency'], where: { customer: financeCustomerWhere(c), currency: c.q.currency, status: 'COMPLETED', completedAt: range(c) }, _sum: { amount: true }, _count: { _all: true }, orderBy: { currency: 'asc' } }), source: 'FinancePayment,FinanceRefund', definition: 'Receipts by observed paidAt and current verification state; only VERIFIED is verified manual receipt, not bank reconciliation. Completed refunds by observed completedAt; no cross-currency sum.' };
}
export async function expenses(c: Context) {
    requireDepartment(c, 'finance');
    const where = { AND: [expenseWhere(c), { incurredAt: range(c), status: c.q.status as FinanceApprovalStatus | undefined }] };
    return { byCurrencyStatusCategory: await c.tx.financeExpense.groupBy({ by: ['currency', 'status', 'category'], where, _sum: { amount: true }, _count: { _all: true }, orderBy: [{ currency: 'asc' }, { status: 'asc' }, { category: 'asc' }] }), source: 'FinanceExpense', definition: 'Actual net cost incurred in interval by current approval/recognition state; only RECORDED is recognized operational cost, not bank payment or payroll' };
}
export async function profitability(c: Context) {
    requireDepartment(c, 'finance');
    const where = { customer: financeCustomerWhere(c), siteId: c.q.siteId, id: c.q.installationId };
    const jobs = await c.tx.installationJob.findMany({ where, ...paging(c.q), select: { id: true, reference: true }, orderBy: { id: 'asc' } }), ids = jobs.map(j => j.id);
    const invoices = bounded(await c.tx.financeInvoice.findMany({ where: { AND: [invoiceWhere(c), { order: { installationId: { in: ids } } }] }, take: 5001, orderBy: { id: 'asc' } }), 5000), balances = await balancesAt(c, invoices);
    const orders = bounded(await c.tx.financeSalesOrder.findMany({ where: { AND: [financeOrderWhere(c), { installationId: { in: ids }, OR: [{ id: { in: invoices.map(i => i.orderId) } }, { createdAt: range(c) }] }] }, select: { id: true, installationId: true, currency: true, createdAt: true, quotation: { select: { taxableAmount: true, estimatedCost: true, estimatedMargin: true } } }, take: LIMIT + 1, orderBy: { id: 'asc' } })), orderMap = new Map(orders.map(o => [o.id, o.installationId]));
    const costs = await c.tx.financeExpense.groupBy({ by: ['installationId', 'currency'], where: { AND: [expenseWhere(c), { installationId: { in: ids }, status: 'RECORDED', recordedAt: range(c) }] }, _sum: { amount: true } });
    const data = jobs.map(j => {
        const billed = balances.filter(b => orderMap.get(b.invoice.orderId) === j.id), actual = costs.filter(e => e.installationId === j.id), estimated = orders.filter(o => o.installationId === j.id && o.createdAt >= c.from && o.createdAt < c.to);
        const currencies = [...new Set([...billed.map(b => b.invoice.currency), ...actual.map(e => e.currency), ...estimated.map(o => o.currency)])].sort();
        return { installationId: j.id, reference: j.reference, byCurrency: currencies.map(currency => {
                const netBilled = sum(billed.filter(b => b.invoice.currency === currency).map(b => dec(b.invoice.taxableAmount).minus(b.creditNet))), recordedNetCosts = dec(actual.find(e => e.currency === currency)?._sum.amount ?? '0');
                const selected = estimated.filter(o => o.currency === currency), comparable = selected.length > 0 && selected.every(o => o.quotation.estimatedCost !== null && o.quotation.estimatedMargin !== null);
                return { currency, netBilled, recordedNetCosts, netBilledLessRecordedCosts: netBilled.minus(recordedNetCosts), commercialEstimatedNetRevenue: selected.length ? sum(selected.map(o => o.quotation.taxableAmount)) : null, commercialEstimatedNetCost: comparable ? sum(selected.map(o => o.quotation.estimatedCost!)) : null, commercialEstimatedGrossMargin: comparable ? sum(selected.map(o => o.quotation.estimatedMargin!)) : null, estimatedProfit: null, grossMargin: null, costCompleteness: 'NOT_ESTABLISHED' };
            }) };
    });
    return { ...page(data, await c.tx.installationJob.count({ where }), c.q), source: 'FinanceSalesOrder.installationId,FinanceQuotation,FinanceInvoice,FinanceCreditNote,FinanceExpense', definition: 'Explicitly linked orders only; invoices issued in interval with current credits, actual costs recorded in interval. Commercial estimates come only from accepted-order M09 comparable quotation snapshots for orders created in interval; null if any estimate missing. Billed less recorded cost is not accounting profit; actual cost completeness absent. No BOM or planned labor costs inferred.' };
}
export async function financeSummary(c: Context) {
    requireDepartment(c, 'finance');
    const tx = c.tx, q = c.q;
    const invoices = bounded(await tx.financeInvoice.findMany({ where: invoiceWhere(c), take: 5001, orderBy: { id: 'asc' } }), 5000), balances = await balancesAt(c, invoices);
    const quotes = financeQuoteWhere(c), orders = financeOrderWhere(c), customer = financeCustomerWhere(c), projectOnly = !!(q.siteId || q.installationId);
    const [accepted, pipeline, orderTotals, receipts, refunds, costs, approvedExpenses, charges] = await Promise.all([
        tx.financeQuotation.groupBy({ by: ['currency'], where: { AND: [quotes, { status: 'ACCEPTED', acceptedAt: range(c) }] }, _sum: { totalAmount: true }, orderBy: { currency: 'asc' } }),
        tx.financeQuotation.groupBy({ by: ['currency'], where: { AND: [quotes, { createdAt: range(c), status: { in: ['DRAFT', 'SUBMITTED_FOR_APPROVAL', 'APPROVED', 'SENT'] }, validUntil: { gt: c.asOf } }] }, _sum: { totalAmount: true }, orderBy: { currency: 'asc' } }),
        tx.financeSalesOrder.groupBy({ by: ['currency'], where: { AND: [orders, { createdAt: range(c) }] }, _sum: { totalAmount: true }, orderBy: { currency: 'asc' } }),
        projectOnly ? Promise.resolve(null) : tx.financePayment.groupBy({ by: ['currency'], where: { customer, currency: q.currency, status: 'VERIFIED', paidAt: range(c) }, _sum: { amount: true }, orderBy: { currency: 'asc' } }),
        projectOnly ? Promise.resolve(null) : tx.financeRefund.groupBy({ by: ['currency'], where: { customer, currency: q.currency, status: 'COMPLETED', completedAt: range(c) }, _sum: { amount: true }, orderBy: { currency: 'asc' } }),
        tx.financeExpense.groupBy({ by: ['currency'], where: { AND: [expenseWhere(c), { status: 'RECORDED', recordedAt: range(c) }] }, _sum: { amount: true }, orderBy: { currency: 'asc' } }),
        tx.financeExpense.groupBy({ by: ['currency'], where: { AND: [expenseWhere(c), { status: { in: ['APPROVED', 'RECORDED'] }, approvedAt: range(c) }] }, _sum: { amount: true }, orderBy: { currency: 'asc' } }),
        tx.financeServiceCharge.groupBy({ by: ['currency'], where: { customer, serviceTicket: { installationId: q.installationId, siteId: q.siteId }, currency: q.currency, status: 'APPROVED', approvedAt: range(c) }, _sum: { proposedAmount: true }, orderBy: { currency: 'asc' } })
    ]);
    const currencies = [...new Set([...invoices.map(i => i.currency), ...accepted.map(r => r.currency), ...pipeline.map(r => r.currency), ...orderTotals.map(r => r.currency), ...(receipts ?? []).map(r => r.currency), ...(refunds ?? []).map(r => r.currency), ...costs.map(r => r.currency), ...approvedExpenses.map(r => r.currency), ...charges.map(r => r.currency)])].sort();
    const amount = (rows: {
        currency: string;
        _sum: {
            totalAmount?: Prisma.Decimal | null;
            amount?: Prisma.Decimal | null;
            proposedAmount?: Prisma.Decimal | null;
        };
    }[], currency: string, key: 'totalAmount' | 'amount' | 'proposedAmount') => dec(rows.find(r => r.currency === currency)?._sum[key] ?? '0');
    return { byCurrency: currencies.map(currency => { const b = balances.filter(b => b.invoice.currency === currency); return { currency, quotationPipeline: amount(pipeline, currency, 'totalAmount'), acceptedQuotationValue: amount(accepted, currency, 'totalAmount'), orderValue: amount(orderTotals, currency, 'totalAmount'), issuedInvoiceGross: sum(b.map(x => x.invoice.totalAmount)), issuedCreditGross: sum(b.map(x => x.creditAmount)), netBilledExcludingTax: sum(b.map(x => dec(x.invoice.taxableAmount).minus(x.creditNet))), allocatedVerifiedPayments: sum(b.map(x => x.allocatedAmount)), outstandingReceivables: sum(b.map(x => x.outstanding)), overdueInvoiceCount: b.filter(x => x.effectiveStatus === 'OVERDUE').length, overdueOutstanding: sum(b.filter(x => x.effectiveStatus === 'OVERDUE').map(x => x.outstanding)), verifiedManualReceipts: receipts ? amount(receipts, currency, 'amount') : null, completedRefunds: refunds ? amount(refunds, currency, 'amount') : null, recordedActualNetCosts: amount(costs, currency, 'amount'), approvedExpenseAmount: amount(approvedExpenses, currency, 'amount'), approvedServiceChargeCeiling: amount(charges, currency, 'proposedAmount'), overallProfit: null }; }), definitions: { quotationPipeline: 'FinanceQuotation creation cohort, current live DRAFT/SUBMITTED_FOR_APPROVAL/APPROVED/SENT, not revenue', acceptedQuotationValue: 'FinanceQuotation acceptedAt in interval, ACCEPTED only', orderValue: 'FinanceSalesOrder createdAt in interval, not receipt', issuedInvoiceGross: 'FinanceInvoice issuedAt in interval, current ISSUED only', issuedCreditGross: 'Current issued FinanceCreditNote against that invoice cohort, including credits after interval', netBilledExcludingTax: 'Issued taxable amount less issued credit net, not collected cash', allocatedVerifiedPayments: 'M09 current active allocations against invoice cohort after releases, verified funds only', outstandingReceivables: 'Current gross less issued credits and active verified allocations for issued-in-interval invoices', overdue: 'Positive current outstanding past dueAt at asOf', verifiedManualReceipts: 'FinancePayment paidAt in interval, current VERIFIED; null under site/installation filters because customer receipt cannot truthfully be attributed wholly to one project', completedRefunds: 'FinanceRefund completedAt in interval, observed COMPLETED; same project-attribution limitation', recordedActualNetCosts: 'FinanceExpense RECORDED, recordedAt in interval, net actual costs; not bank payments', approvedExpenseAmount: 'APPROVED/RECORDED expense with approvedAt in interval, not additive to recorded costs', approvedServiceChargeCeiling: 'APPROVED FinanceServiceCharge approvedAt in interval, proposed ceiling not invoiced revenue', overallProfit: 'Null: complete recognized cost/revenue basis not established' }, currenciesCombined: false, asOf: c.asOf };
}
