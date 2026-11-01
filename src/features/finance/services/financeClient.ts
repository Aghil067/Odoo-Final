import {apiClient,getData,getPage,postData,patchData,uploadEvidence} from '../../../services/apiClient';
export const financeCurrencies=['INR','USD','EUR','GBP'];
export const financeGroups=['quotations','orders','invoices','payments','credit-notes','refunds','expenses','service-charges'] as const;
export type FinanceGroup=typeof financeGroups[number];
export const financeEvidenceTypes=['CUSTOMER_ACCEPTANCE','PAYMENT_PROOF','CREDIT_SUPPORT','REFUND_PROOF','EXPENSE_RECEIPT','SERVICE_CHARGE_SUPPORT','OTHER'];
export interface FinanceDocument {id:string;reference:string;customerId:string|null;currency:string;version:number;status?:string;createdAt:string;totalAmount?:string;amount?:string;proposedAmount?:string;description?:string;notes?:string;createdById?:string;requestedById?:string;approvedById?:string|null;approvedAt?:string|null;recordedAt?:string|null;issuedAt?:string|null;completedAt?:string|null;invoiceId?:string;paymentId?:string;serviceTicketId?:string;installationId?:string|null;category?:string;vendorOrPayee?:string;incurredAt?:string;refundReason?:string;adjustmentReason?:string;allowedKinds?:string[];taxableAmount?:string|null;taxAmount?:string|null}
export interface FinanceQuoteLine {id:string;priceBookLineId:string;taxRuleId:string;position:number;kind:string;description:string;unit:string;quantity:string;unitPrice:string;enteredDiscount:string;subtotal:string;discountAmount:string;taxableAmount:string;taxAmount:string;totalAmount:string;estimatedCost?:string|null;taxSnapshot?:FinanceTaxRule}
export interface FinanceQuote extends FinanceDocument {kind:'INSTALLATION'|'SERVICE';customerId:string;configurationId:string|null;configurationApprovedVersion:number|null;configurationReviewId:string|null;bomId:string|null;bomVersion:number|null;serviceChargeId:string|null;priceBookId:string;revision:number;previousId:string|null;validUntil:string;terms:string;subtotal:string;discountAmount:string;taxableAmount:string;taxAmount:string;totalAmount:string;estimatedCost?:string|null;estimatedMargin?:string|null;sensitivePricing:boolean;effectiveStatus:string;preparedById:string;sentAt:string|null;acceptedAt:string|null;lines:FinanceQuoteLine[]}
export interface FinanceOrder extends FinanceDocument {quotationId:string;installationId:string|null;siteId:string;acceptedAt:string;totalAmount:string}
export interface FinanceInvoice extends FinanceDocument {orderId:string;customerId:string;siteId:string;subtotal:string;discountAmount:string;taxableAmount:string;taxAmount:string;totalAmount:string;dueAt:string;notes:string;issuedById:string|null;termsSnapshot:{terms?:string;scope?:string};lines?:{id:string;position:number;subtotal:string;discountAmount:string;taxableAmount:string;taxAmount:string;totalAmount:string;snapshot:{description?:string;kind?:string;unit?:string;quantity?:string;unitPrice?:string}}[]}
export interface InvoiceBalance {invoice:FinanceInvoice;creditAmount:string;creditTax:string;creditNet:string;netDue:string;allocatedAmount:string;outstanding:string;effectiveStatus:string;asOf:string;lines?:NonNullable<FinanceInvoice['lines']>}
export interface FinancePayment extends FinanceDocument {customerId:string;amount:string;method:string;externalReference:string;paidAt:string;notes:string;recordedById:string;verifiedById:string|null;verifiedAt:string|null}
export interface PaymentBalance {payment:FinancePayment;allocatedAmount:string;reservedRefunds:string;completedRefunds:string;unallocatedBeforeRefunds:string;availableVerified:string}
export interface FinanceAllocation {activeAmount:string;invoice:{id:string;reference:string;version:number;currency:string;status:string};id:string;invoiceId:string;paymentId:string;amount:string;createdAt:string;releases:{id:string;amount:string;reason:string;createdAt:string}[]}
export interface FinancePriceLine {id:string;code:string;kind:string;componentId:string|null;description:string;unit:string;unitPrice:string;estimatedUnitCost?:string|null;costSourceNotes?:string|null}
export interface FinancePriceBook {id:string;reference:string;revision:number;version:number;name:string;currency:string;effectiveFrom:string;effectiveTo:string|null;isActive:boolean;discountApprovalPercent:string;approvalThresholdAmount:string;lines:FinancePriceLine[]}
export interface FinanceTaxRule {id:string;reference:string;revision:number;version:number;name:string;currency:string;ratePercent:string;inclusive:boolean;jurisdictionNotes:string;effectiveFrom:string;effectiveTo:string|null;isActive:boolean}
export interface FinanceEvidence {id:string;ownerVersion:number;type:string;fileName:string;mimeType:string;sizeBytes:number;sha256:string;createdAt:string}
export interface FinanceConfiguration {id:string;name:string;reference:string;customerId:string;siteId:string;approvedVersion:number|null}
export interface FinanceInstallation {id:string;name:string;reference:string;customerId:string;siteId:string;status:string}
export interface FinanceServiceTicket {id:string;reference:string;status:string;customerId:string;installationId:string;reportedIssue:string}
export interface FinanceCustomer {id:string;name:string;reference:string;companyName:string|null}
export interface FinanceSource {configurationId:string;approvedVersion:number;reviewId:string;bomId:string;bomVersion:number;lines:{componentId:string;quantity:string;unit:string;sku:string;description:string}[]}
export interface FinancePreview {currency:string;priceBookId:string;lines:FinanceQuoteLine[];subtotal:string;discountAmount:string;taxableAmount:string;taxAmount:string;totalAmount:string;estimatedCost?:string|null;estimatedMargin?:string|null;sensitivePricing:boolean;calculation:string}
type Page={page?:number;pageSize?:number};
type Query=Page&{customerId?:string;currency?:string;q?:string;quoteStatus?:string;paymentStatus?:string;approvalStatus?:string};
export const money=(currency:string,amount:string|null|undefined)=>amount===null||amount===undefined?'Unavailable':currency+' '+amount;
export const financeClient={
 list:<T=FinanceDocument>(group:FinanceGroup,q:Query={})=>getPage<T>('/finance/'+group,q),
 detail:<T=FinanceDocument>(group:FinanceGroup,id:string)=>getData<T>(`/finance/${group}/${id}`),
 create:<T=FinanceDocument>(group:FinanceGroup,body:unknown)=>postData<T>('/finance/'+group,body),
 edit:<T=FinanceDocument>(group:FinanceGroup,id:string,body:unknown)=>patchData<T>(`/finance/${group}/${id}`,body),
 command:<T=unknown>(group:FinanceGroup,id:string,action:string,body:unknown)=>postData<T>(`/finance/${group}/${id}/${action}`,body),
 order:(quoteId:string,body:unknown)=>postData<FinanceOrder>(`/finance/orders/from-quotation/${quoteId}`,body),
 allocations:(id:string,page=1)=>getPage<FinanceAllocation>(`/finance/payments/${id}/allocations`,{page,pageSize:20}),
 release:(paymentId:string,allocationId:string,body:unknown)=>postData<unknown>(`/finance/payments/${paymentId}/allocations/${allocationId}/release`,body),
 preview:(body:unknown)=>postData<FinancePreview>('/finance/pricing/preview',body),
 books:(q:Page&{q?:string}={})=>getPage<FinancePriceBook>('/finance/price-books',q),
 book:(id:string)=>getData<FinancePriceBook>(`/finance/price-books/${id}`),
 taxes:(q:Page&{q?:string}={})=>getPage<FinanceTaxRule>('/finance/tax-rules',q),
 tax:(id:string)=>getData<FinanceTaxRule>(`/finance/tax-rules/${id}`),
 createBook:(body:unknown)=>postData<FinancePriceBook>('/finance/price-books',body),
 createTax:(body:unknown)=>postData<FinanceTaxRule>('/finance/tax-rules',body),
 deactivate:(kind:'price-books'|'tax-rules',id:string,body:unknown)=>postData<unknown>(`/finance/${kind}/${id}/deactivate`,body),
 configurations:(q:Page&{q?:string}={})=>getPage<FinanceConfiguration>('/finance/configurations',q),
 serviceQuoteSources:(q:Page&{q?:string}={})=>getPage<{id:string;reference:string;description:string;currency:string;proposedAmount:string;allowedKinds:string[];serviceTicketId:string}>('/finance/quotation-service-sources',q),
 source:(id:string)=>getData<FinanceSource>(`/finance/configurations/${id}/quotation-source`),
 installations:(q:Page&{q?:string}={})=>getPage<FinanceInstallation>('/finance/installations',q),
 serviceTickets:(q:Page&{q?:string}={})=>getPage<FinanceServiceTicket>('/finance/service-tickets',q),
 customers:(q:Page&{q?:string}={})=>getPage<FinanceCustomer>('/finance/customers',q),
 people:(q:Page&{q?:string}={})=>getPage<{id:string;name:string}>('/finance/people',q),
 history:<T>(group:FinanceGroup,id:string,page=1)=>getPage<T>(`/finance/${group}/${id}/history`,{page,pageSize:20}),
 evidence:(group:FinanceGroup,id:string,page=1)=>getPage<FinanceEvidence>(`/finance/${group}/${id}/evidence`,{page,pageSize:20}),
 upload:(group:FinanceGroup,id:string,file:File,params:Record<string,string|number>)=>uploadEvidence<{evidence:FinanceEvidence;ownerVersion:number}>(`/finance/${group}/${id}/evidence`,file,params),
 download:async(group:FinanceGroup,id:string,file:FinanceEvidence)=>{const r=await apiClient.get<Blob>(`/finance/${group}/${id}/evidence/${file.id}/download`,{responseType:'blob'});const url=URL.createObjectURL(r.data),a=document.createElement('a');a.href=url;a.download=file.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},
 summary:(q:{customerId?:string;currency?:string}={})=>getData<{asOf:string;byCurrency:{currency:string;originalIssuedGross:string;issuedCreditGross:string;netBilledExcludingTax:string;netBilledTax:string;allocatedVerifiedReceipts:string;outstanding:string}[];accountingBasis:string;currenciesCombined:false}>('/finance/summary',{params:q}),
 receivables:(q:Page&{customerId?:string;currency?:string}={})=>getPage<InvoiceBalance>('/finance/receivables',q),
 paymentSummary:(q:{customerId?:string;currency?:string}={})=>getData<{payments:{currency:string;status:string;_sum:{amount:string|null};_count:number}[];refunds:{currency:string;status:string;_sum:{amount:string|null};_count:number}[];meaning:string}>('/finance/payments/summary',{params:q}),
 expenseSummary:(q:{customerId?:string;currency?:string}={})=>getData<{data:{currency:string;status:string;_sum:{amount:string|null};_count:number}[];recognition:string;bankPaymentExecution:string}>('/finance/expenses/summary',{params:q}),
 profitability:(installationId:string)=>getData<{installationId:string;byCurrency:{currency:string;netBilled:string;recordedNetCosts:string;netBilledLessRecordedCosts:string;grossMargin:null;costCompleteness:string}[];basis:string;plannedLaborHoursUsed:false;bomCostRecognizedAutomatically:false}>('/finance/project-profitability',{params:{installationId}}),
 grants:(customerId:string,page=1)=>getPage<{id:string;customerId:string;userId:string;version:number;isActive:boolean;user:{id:string;name:string;isActive:boolean}}>('/finance/access',{customerId,page,pageSize:20}),
 grant:(id:string,body:unknown)=>postData<unknown>(`/finance/customers/${id}/access`,body),
 revoke:(id:string,body:unknown)=>postData<unknown>(`/finance/access/${id}/revoke`,body)
};
