import {apiClient} from '../../../services/apiClient';
export interface AnalyticsView{path:string;label:string;department:string;filters:string[]}
const project=['from','to','customerId','siteId','installationId','technicianId'];
const money=['from','to','customerId','siteId','installationId','currency'];
const paged=['page','pageSize'];
export const analyticsViews:AnalyticsView[]=[
 {path:'overview',label:'Executive Overview',department:'overview',filters:[...project,'currency']},
 ...['summary','funnel','trends','conversions'].map(view=>({path:'sales/'+view,label:'Sales '+view,department:'sales',filters:[...project,...(view==='trends'?['groupBy']:[]),'status','priority']})),
 ...['summary','trends'].map(view=>({path:'surveys/'+view,label:'Surveys '+view,department:'surveys',filters:[...project,...(view==='trends'?['groupBy']:[]),'status']})),
 ...['summary','capacity','components'].map(view=>({path:'solar/'+view,label:'Solar Design '+view,department:'solar',filters:[...project,'status',...(view==='components'?['currency',...paged]:[])]})),
 ...['summary','warehouses','low-stock','movements'].map(view=>({path:'inventory/'+view,label:'Inventory '+view,department:'inventory',filters:['warehouseId',...(view==='summary'?[]:paged),...(view==='movements'?['from','to','groupBy','status']:[])]})),
 ...['summary','trends','milestones','blockers'].map(view=>({path:'installations/'+view,label:'Installations '+view,department:'installations',filters:[...project,'status',...(view==='trends'?['groupBy']:[]),...(['milestones','blockers'].includes(view)?paged:[])]})),
 ...['summary','workload','availability','certifications'].map(view=>({path:'technicians/'+view,label:'Technicians '+view,department:'technicians',filters:['technicianId',...(view==='certifications'?['days',...paged]:['from','to',...(view==='summary'?[]:paged)])]})),
 ...['summary','expiring','claims'].map(view=>({path:'warranties/'+view,label:'Warranty '+view,department:'warranties',filters:['customerId','siteId','installationId',...(view==='expiring'?['days',...paged]:['from','to','status'])]})),
 ...['summary','trends','sla','maintenance'].map(view=>({path:'service/'+view,label:'Service '+view,department:'service',filters:view==='maintenance'?['from','to','customerId','siteId','installationId',...paged]:[...project,'status','priority',...(view==='trends'?['groupBy']:[])]})),
 ...['summary','quotations','invoices','payments','receivables','expenses','profitability'].map(view=>({path:'finance/'+view,label:'Finance '+view,department:'finance',filters:[...(view==='payments'?['from','to','customerId','currency']:money),...(['invoices','receivables','profitability'].includes(view)?paged:[]),...(['quotations','invoices','payments','expenses'].includes(view)?['status']:[])]})),
 {path:'alerts',label:'Business Alerts',department:'overview',filters:[...project,'currency','days',...paged]},
 {path:'reports/operations',label:'Operations Report',department:'overview',filters:[...project,'currency']},
 {path:'reports/projects/:id',label:'Project Report',department:'reports',filters:['from','to','currency',...paged]},
 {path:'reports/customers/:id',label:'Customer Report',department:'reports',filters:['from','to','currency',...paged]}
];
export const analyticsService={async read(view:AnalyticsView,filters:Record<string,unknown>,signal?:AbortSignal){const params=Object.fromEntries(view.filters.flatMap(key=>filters[key]!==undefined&&filters[key]!==''?[[key,filters[key]]]:[]));return (await apiClient.get<{data:unknown;meta:{asOf:string;from:string;to:string}}>(`/analytics/${view.path}`,{params,signal})).data;}};
