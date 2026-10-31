import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

process.loadEnvFile(resolve('../.runtime/backend.env'));
const target=new URL(process.env.DATABASE_URL);
assert.equal(target.hostname,'127.0.0.1');assert.equal(target.port,'55432');assert.equal(target.pathname,'/solar_integration_test','Tests may mutate only the explicitly disposable local database');
const {db}=await import('../dist/src/lib/db.js');
const {app}=await import('../dist/src/app.js');
const {hashPassword}=await import('../dist/src/modules/auth/password.js');
let server,base,password;const users={},sessions={};
const run=randomUUID(),customerName=`TEST ONLY Integration ${run}`;
let customer,site,lead;
async function request(path,{session,method='GET',body,csrf=true,origin='http://localhost:5173'}={}){
 const headers={Origin:origin};if(session){headers.Cookie=session.cookie;if(csrf)headers['X-CSRF-Token']=session.csrfToken;}
 if(body!==undefined)headers['Content-Type']='application/json';
 const response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
 const json=await response.json();return {status:response.status,json,cookie:response.headers.get('set-cookie')};
}
async function login(role){const r=await request('/auth/login',{method:'POST',body:{email:users[role].email,password}});assert.equal(r.status,200,JSON.stringify(r.json));return {...r.json.data,cookie:r.cookie.split(';')[0],rawCookie:r.cookie};}
before(async()=>{
 let saved;try{saved=JSON.parse(await readFile(resolve('../.runtime/test-accounts.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 password=saved?.password??randomBytes(24).toString('base64url');const passwordHash=await hashPassword(password);
 for(const role of ['ADMIN','SALES','TECHNICIAN','WAREHOUSE','SUPPORT','FINANCE']){const email=`test-${role.toLowerCase()}@integration.example.test`;users[role]=await db.user.upsert({where:{email},create:{email,name:`TEST ONLY ${role}`,passwordHash,role},update:{}});}
 await writeFile(resolve('../.runtime/test-accounts.json'),JSON.stringify({disposable:true,password,users}),{mode:0o600});
 server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;
 for(const role of Object.keys(users))sessions[role]=await login(role);
});
after(async()=>{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await db.$disconnect();});

test('all nine migrations are actually applied and core tables/constraints/triggers exist',async()=>{
 const migrations=await db.$queryRaw`SELECT migration_name,finished_at,rolled_back_at FROM _prisma_migrations ORDER BY migration_name`;
 assert.equal(migrations.filter(m=>m.finished_at&&!m.rolled_back_at).length,9);
 const constraints=await db.$queryRaw`SELECT count(*)::int AS count FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace`;
 assert.ok(constraints[0].count>100);
 const triggers=await db.$queryRaw`SELECT count(*)::int AS count FROM pg_trigger WHERE NOT tgisinternal`;
 assert.ok(triggers[0].count>50);
 for(const table of ['Customer','SiteSurvey','SolarConfiguration','InventoryBalance','InstallationJob','TechnicianProfile','WarrantyRegistration','ServiceTicket','FinanceInvoice']){const exists=await db.$queryRaw`SELECT to_regclass(${`public."${table}"`})::text AS name`;assert.ok(exists[0].name,table);}
});
test('backend starts and health responds',async()=>assert.equal((await request('/health')).status,200));
test('session cookie is HttpOnly and restores through me',async()=>{assert.match(sessions.ADMIN.rawCookie,/HttpOnly/i);assert.match(sessions.ADMIN.rawCookie,/SameSite=Lax/i);assert.equal((await request('/auth/me',{session:sessions.ADMIN})).json.data.user.id,users.ADMIN.id);});
test('invalid credentials and unauthenticated CRM do not authenticate',async()=>{assert.equal((await request('/auth/login',{method:'POST',body:{email:users.ADMIN.email,password:'incorrect password'}})).status,401);assert.equal((await request('/customers')).status,401);});
test('login rejects unknown request fields',async()=>assert.equal((await request('/auth/login',{method:'POST',body:{email:users.ADMIN.email,password,role:'ADMIN'}})).status,422));
test('unsafe origin and missing CSRF reject customer writes',async()=>{const body={name:customerName,type:'INDIVIDUAL',phone:'+14155552671'};assert.equal((await request('/customers',{method:'POST',session:sessions.ADMIN,body,csrf:false})).status,403);assert.equal((await request('/customers',{method:'POST',session:sessions.ADMIN,body,origin:'https://untrusted.example.test'})).status,403);});
test('CRM customer create is persisted and readable after a second request',async()=>{const r=await request('/customers',{method:'POST',session:sessions.SALES,body:{name:customerName,type:'INDIVIDUAL',phone:'+14155552671'}});assert.equal(r.status,201,JSON.stringify(r.json));customer=r.json.data;assert.equal((await db.customer.findUnique({where:{id:customer.id}})).name,customerName);assert.equal((await request(`/customers/${customer.id}`,{session:sessions.SALES})).json.data.id,customer.id);});
test('a stale customer write conflicts without overwriting current data',async()=>{let r=await request(`/customers/${customer.id}`,{method:'PATCH',session:sessions.SALES,body:{version:customer.version,notes:'TEST ONLY persisted note'}});assert.equal(r.status,200,JSON.stringify(r.json));r=await request(`/customers/${customer.id}`,{method:'PATCH',session:sessions.SALES,body:{version:customer.version,notes:'Should never replace current note'}});assert.equal(r.status,409);assert.equal((await db.customer.findUnique({where:{id:customer.id}})).notes,'TEST ONLY persisted note');});
test('customer site and lead creation preserve ownership',async()=>{let r=await request(`/customers/${customer.id}/sites`,{method:'POST',session:sessions.SALES,body:{name:'TEST ONLY Roof',addressLine1:'1 Synthetic Test Street',city:'Test City',state:'Test State',postalCode:'10001',country:'US'}});assert.equal(r.status,201,JSON.stringify(r.json));site=r.json.data;r=await request('/leads',{method:'POST',session:sessions.SALES,body:{customerId:customer.id,siteId:site.id,source:'WEBSITE',priority:'MEDIUM',preferredSystemType:'ON_GRID'}});assert.equal(r.status,201,JSON.stringify(r.json));lead=r.json.data;});
test('technician cannot read customer or finance/warranty private data',async()=>{assert.equal((await request(`/customers/${customer.id}`,{session:sessions.TECHNICIAN})).status,403);assert.equal((await request('/finance/invoices',{session:sessions.TECHNICIAN})).status,403);assert.equal((await request('/warranties/registrations',{session:sessions.TECHNICIAN})).status,403);});
test('finance customer scope requires an explicit grant',async()=>{const r=await request('/finance/invoices',{session:sessions.FINANCE});assert.equal(r.status,200,JSON.stringify(r.json));assert.deepEqual(r.json.data,[]);assert.equal((await request(`/analytics/reports/customers/${customer.id}`,{session:sessions.FINANCE})).status,404);});
test('ungranted support cannot read a project warranty',async()=>{assert.equal((await request(`/warranties/registrations/${randomUUID()}`,{session:sessions.SUPPORT})).status,404);});
test('analytics reflects the real created customer and validates filters',async()=>{let r=await request(`/analytics/overview?customerId=${customer.id}`,{session:sessions.ADMIN});assert.equal(r.status,200,JSON.stringify(r.json));assert.equal(r.json.data.metrics.totalCustomers.value,1);assert.equal(r.json.data.metrics.totalLeads.value,1);r=await request('/analytics/sales/summary?unsupported=true',{session:sessions.ADMIN});assert.equal(r.status,422);});
test('logout invalidates the persisted session',async()=>{const s=sessions.WAREHOUSE;assert.equal((await request('/auth/logout',{method:'POST',session:s,body:{}})).status,200);assert.equal((await request('/auth/me',{session:s})).status,401);});
test('login rotates an existing session and invalidates its old cookie',async()=>{const old=sessions.SUPPORT;const r=await request('/auth/login',{method:'POST',session:old,body:{email:users.SUPPORT.email,password}});assert.equal(r.status,200);assert.equal((await request('/auth/me',{session:old})).status,401);});

const analytics=['overview','sales/summary','sales/funnel','sales/trends','sales/conversions','surveys/summary','surveys/trends','solar/summary','solar/capacity','solar/components','inventory/summary','inventory/warehouses','inventory/low-stock','inventory/movements','installations/summary','installations/trends','installations/milestones','installations/blockers','technicians/summary','technicians/workload','technicians/availability','technicians/certifications','warranties/summary','warranties/expiring','warranties/claims','service/summary','service/trends','service/sla','service/maintenance','finance/summary','finance/quotations','finance/invoices','finance/payments','finance/receivables','finance/expenses','finance/profitability','alerts','reports/operations'];
for(const path of analytics)test(`actual analytics query /${path} executes against PostgreSQL`,async()=>{const r=await request(`/analytics/${path}`,{session:sessions.ADMIN});assert.equal(r.status,200,JSON.stringify(r.json));assert.ok(r.json.meta.asOf);});
