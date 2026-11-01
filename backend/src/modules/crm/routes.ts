import { Router, type Request, type Response } from 'express';
import { actor, authenticate, allowRoles, requireCsrf } from '../auth/auth.js';
import { success } from '../../lib/http.js';
import * as v from './validation.js';
import * as customers from './customers.service.js';
import * as sites from './sites.service.js';
import * as leads from './leads.service.js';
import { crmSummary, salespeople } from './summary.service.js';

export const crmRouter = Router();
crmRouter.use(authenticate, allowRoles('ADMIN', 'SALES'), requireCsrf);
const id = (req: Request) => v.idParams.parse(req.params).id;
function list(res: Response, result: { data: unknown; pagination: unknown }) { return success(res, result.data, 200, { pagination: result.pagination }); }

crmRouter.post('/customers', async (req, res) => {
  const result = await customers.createCustomer(actor(req), v.createCustomer.parse(req.body));
  return success(res, result.customer, 201, { warnings: result.warnings });
});
crmRouter.get('/customers', async (req, res) => list(res, await customers.listCustomers(actor(req), v.customerQuery.parse(req.query))));
crmRouter.get('/customers/:id', async (req, res) => success(res, await customers.customerDetail(actor(req), id(req))));
crmRouter.patch('/customers/:id', async (req, res) => {
  const result = await customers.updateCustomer(actor(req), id(req), v.updateCustomer.parse(req.body));
  return success(res, result.customer, 200, { warnings: result.warnings });
});
crmRouter.post('/customers/:id/archive', async (req, res) => success(res, await customers.archiveCustomer(actor(req), id(req), v.versionInput.parse(req.body).version)));
crmRouter.get('/customers/:id/activities',async(req,res)=>list(res,await customers.customerActivities(actor(req),id(req),v.timelineQuery.parse(req.query))));
crmRouter.post('/customers/:id/sites', async (req, res) => success(res, await sites.createSite(actor(req), id(req), v.createSite.parse(req.body)), 201));
crmRouter.get('/customers/:id/sites', async (req, res) => list(res, await sites.listSites(actor(req), id(req), v.siteQuery.parse(req.query))));
crmRouter.get('/sites/:id', async (req, res) => success(res, await sites.siteDetail(actor(req), id(req))));
crmRouter.patch('/sites/:id', async (req, res) => success(res, await sites.updateSite(actor(req), id(req), v.updateSite.parse(req.body))));

crmRouter.post('/leads', async (req, res) => success(res, await leads.createLead(actor(req), v.createLead.parse(req.body)), 201));
crmRouter.get('/leads', async (req, res) => list(res, await leads.listLeads(actor(req), v.leadQuery.parse(req.query))));
crmRouter.get('/leads/:id', async (req, res) => success(res, await leads.leadDetail(actor(req), id(req))));
crmRouter.patch('/leads/:id', async (req, res) => success(res, await leads.updateLead(actor(req), id(req), v.updateLead.parse(req.body))));
crmRouter.post('/leads/:id/status', async (req, res) => success(res, await leads.changeStatus(actor(req), id(req), v.changeStatus.parse(req.body))));
crmRouter.post('/leads/:id/assign', async (req, res) => success(res, await leads.assignLead(actor(req), id(req), v.assignLead.parse(req.body))));
crmRouter.post('/leads/:id/follow-up',async(req,res)=>success(res,await leads.followUp(actor(req),id(req),v.followUpCommand.parse(req.body))));
crmRouter.post('/leads/:id/activities', async (req, res) => success(res, await leads.createActivity(actor(req), id(req), v.createActivity.parse(req.body)), 201));
crmRouter.get('/leads/:id/activities', async (req, res) => list(res, await leads.leadTimeline(actor(req), id(req), v.timelineQuery.parse(req.query), 'activities')));
crmRouter.get('/leads/:id/history', async (req, res) => list(res, await leads.leadTimeline(actor(req), id(req), v.timelineQuery.parse(req.query), 'history')));
crmRouter.get('/crm/cities',async(req,res)=>success(res,await customers.customerCities(actor(req))));
crmRouter.get('/crm/summary', async (req, res) => success(res, await crmSummary(actor(req))));
crmRouter.get('/crm/salespeople', allowRoles('ADMIN'), async (req, res) => list(res, await salespeople(v.salespersonQuery.parse(req.query))));
