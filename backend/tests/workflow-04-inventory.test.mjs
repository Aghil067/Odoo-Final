import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
process.loadEnvFile(resolve('../.runtime/backend.env'));
const target=new URL(process.env.DATABASE_URL);assert.equal(target.hostname,'127.0.0.1');assert.equal(target.port,'55432');assert.equal(target.pathname,'/solar_integration_test');
const fixture=JSON.parse(await readFile('../.runtime/test-accounts.json','utf8')),project=JSON.parse(await readFile('../.runtime/test-project.json','utf8'));assert.equal(fixture.disposable,true);assert.equal(project.disposable,true);assert.ok(project.approvedConfiguration);
const {app}=await import('../dist/src/app.js'),{db}=await import('../dist/src/lib/db.js');let server,base,warehouse,other,reservation,dispatch,serials=[];const sessions={},run=randomUUID(),[panel,inverter,mount]=project.components;
function command(action){return {idempotencyKey:`${run}-${action}`,reference:`TEST-${action}-${run}`,reason:'TEST ONLY isolated warehouse workflow verification'};}
async function request(path,{role='ADMIN',method='GET',body}={}){const s=sessions[role],headers={Origin:'http://localhost:5173','Content-Type':'application/json'};if(s){headers.Cookie=s.cookie;headers['X-CSRF-Token']=s.csrfToken;}const r=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')};}
async function ok(path,options={},status=200){const r=await request(path,options);assert.equal(r.status,status,JSON.stringify(r.json));return r.json.data;}
async function balances(){return ok(`/inventory/balances?warehouseId=${warehouse.id}`);}
before(async()=>{server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;for(const role of ['ADMIN','WAREHOUSE','SALES','TECHNICIAN']){const r=await request('/auth/login',{role:'NONE',method:'POST',body:{email:fixture.users[role].email,password:fixture.password}});assert.equal(r.status,200);sessions[role]={...r.json.data,cookie:r.cookie.split(';')[0]};}});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await db.$disconnect();});
test('warehouse administration is authorized and versioned; absent stock remains unavailable',async()=>{
 const body={...command('WAREHOUSE-A'),code:`TEST-A-${run}`,name:'TEST ONLY Warehouse A',address:'TEST ONLY Synthetic Warehouse Road'};
 assert.equal((await request('/inventory/warehouses',{role:'WAREHOUSE',method:'POST',body})).status,403);
 warehouse=await ok('/inventory/warehouses',{method:'POST',body},201);other=await ok('/inventory/warehouses',{method:'POST',body:{...command('WAREHOUSE-B'),code:`TEST-B-${run}`,name:'TEST ONLY Warehouse B',address:'TEST ONLY Synthetic Transfer Road'}},201);
 const update=await ok(`/inventory/warehouses/${warehouse.id}`,{method:'PATCH',body:{...command('WAREHOUSE-EDIT'),version:warehouse.version,name:'TEST ONLY Warehouse A Updated'}});warehouse=update.warehouse;
 assert.equal((await request(`/inventory/warehouses/${warehouse.id}`,{method:'PATCH',body:{...command('STALE-WAREHOUSE'),version:1,name:'Must not overwrite'}})).status,409);
 const availability=await ok(`/inventory/availability/${project.configuration.id}?warehouseId=${warehouse.id}`,{role:'SALES'});assert.equal(availability.fulfillmentStatus,'UNAVAILABLE');assert.ok(availability.lines.every(l=>l.availableQuantity==='0'));
 const catalog=await ok(`/inventory/components?q=${encodeURIComponent(panel.sku)}`,{role:'WAREHOUSE'});assert.equal(catalog[0].id,panel.id);assert.equal(catalog[0].unitCost,undefined);assert.equal(catalog[0].specifications,undefined);assert.equal((await request('/inventory/components',{role:'TECHNICIAN'})).status,403);
 const designs=await ok(`/inventory/fulfillment-configurations?q=${encodeURIComponent(project.configuration.reference)}`,{role:'WAREHOUSE'});assert.equal(designs[0].id,project.configuration.id);assert.equal(designs[0].customer.phone,undefined);
});
test('serialized receipts reject mismatches and replay without increasing stock twice',async()=>{
 const body={...command('PANEL-RECEIPT'),warehouseId:warehouse.id,componentId:panel.id,quantity:'9',receivedAt:new Date().toISOString(),supplierNotes:'TEST ONLY simulated equipment receipt',serialNumbers:Array.from({length:9},(_,i)=>`TEST-PANEL-${run}-${i}`)};
 assert.equal((await request('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body:{...body,serialNumbers:[]}})).status,422);
 assert.equal((await balances()).length,0,'Failed serial registration must roll back its stock movement');
 const received=await ok('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body},201),replayed=await ok('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body},201);assert.equal(replayed.operationId,received.operationId);assert.equal(replayed.balance.onHandQuantity,'9');
 assert.equal((await request('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body:{...body,quantity:'8'}})).status,409);
 const duplicate={...body,...command('DUPLICATE-SERIAL'),quantity:'1',serialNumbers:[body.serialNumbers[0]]};assert.equal((await request('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body:duplicate})).status,409);assert.equal((await balances())[0].onHandQuantity,'9');
 serials=await ok(`/inventory/serials?warehouseId=${warehouse.id}&componentId=${panel.id}`);assert.equal(serials.length,9);const receipts=await ok(`/inventory/operations?kind=RECEIPT&q=${run}`,{role:'WAREHOUSE'});assert.equal(receipts.length,1);assert.equal(receipts[0].kind,'RECEIPT');assert.equal((await request('/inventory/operations?kind=UNSUPPORTED')).status,422);
});
test('serial transfers preserve immutable identity and exact balances in both warehouses',async()=>{
 const extra=serials[8],body={...command('TRANSFER-OUT'),sourceWarehouseId:warehouse.id,destinationWarehouseId:other.id,componentId:panel.id,quantity:'1',serialIds:[extra.id]};await ok('/inventory/transfers',{role:'WAREHOUSE',method:'POST',body},201);const moved=await ok(`/inventory/serials/${extra.id}`);assert.equal(moved.warehouseId,other.id);assert.equal(moved.serialNumber,extra.serialNumber);
 await ok('/inventory/transfers',{role:'WAREHOUSE',method:'POST',body:{...command('TRANSFER-BACK'),sourceWarehouseId:other.id,destinationWarehouseId:warehouse.id,componentId:panel.id,quantity:'1',serialIds:[extra.id]}},201);assert.equal((await balances())[0].onHandQuantity,'9');
 for(const component of [inverter,mount])await ok('/inventory/receipts',{role:'WAREHOUSE',method:'POST',body:{...command(`RECEIPT-${component.category}`),warehouseId:warehouse.id,componentId:component.id,quantity:'1',receivedAt:new Date().toISOString(),supplierNotes:'TEST ONLY synthetic equipment',serialNumbers:component.serializationRequired?[`TEST-${component.category}-${run}`]:[]}},201);
 const availability=await ok(`/inventory/availability/${project.configuration.id}?warehouseId=${warehouse.id}`);assert.equal(availability.fulfillmentStatus,'AVAILABLE');
});
function reservationInput(label){return {...command(label),configurationId:project.configuration.id,approvedVersion:project.approvedConfiguration.approvedVersion,reviewId:project.approvedConfiguration.reviewId,bomId:project.bom.id,bomVersion:project.bom.version,warehouseId:warehouse.id,serialSelections:[]};}
test('full BOM reservations pin approvals, require exact serial selections and prevent negative available stock',async()=>{
 const inverterSerials=await ok(`/inventory/serials?warehouseId=${warehouse.id}&componentId=${inverter.id}`),body=reservationInput('RESERVE-A');body.serialSelections=[{componentId:panel.id,serialIds:serials.slice(0,8).map(s=>s.id)},{componentId:inverter.id,serialIds:inverterSerials.map(s=>s.id)}];
 assert.equal((await request('/inventory/reservations',{role:'WAREHOUSE',method:'POST',body:{...body,bomVersion:body.bomVersion+1}})).status,409);
 assert.equal((await request('/inventory/reservations',{role:'WAREHOUSE',method:'POST',body:{...body,serialSelections:[]}})).status,422);
 const reserved=await ok('/inventory/reservations',{role:'WAREHOUSE',method:'POST',body},201);reservation=reserved.reservation;const rows=await balances(),p=rows.find(b=>b.componentId===panel.id);assert.equal(p.onHandQuantity,'9');assert.equal(p.reservedQuantity,'8');assert.equal(p.availableQuantity,'1');
 const matches=await ok(`/inventory/reservations?q=${encodeURIComponent(reservation.reference)}`);assert.equal(matches.length,1);assert.equal(matches[0].configuration.name,project.configuration.name);assert.equal((await ok(`/inventory/reservations?q=TEST-NOT-FOUND-${run}`)).length,0);const allocated=await ok(`/inventory/availability/${project.configuration.id}?warehouseId=${warehouse.id}`);assert.equal(allocated.allocation.id,reservation.id);assert.equal(allocated.lines.find(l=>l.componentId===panel.id).serializationRequired,true);
 const again=await ok('/inventory/reservations',{role:'WAREHOUSE',method:'POST',body},201);assert.equal(again.reservation.id,reservation.id);
 assert.equal((await request('/inventory/transfers',{role:'WAREHOUSE',method:'POST',body:{...command('TRANSFER-RESERVED'),sourceWarehouseId:warehouse.id,destinationWarehouseId:other.id,componentId:panel.id,quantity:'1',serialIds:[serials[0].id]}})).status,409);
 assert.equal((await request('/inventory/adjustments',{method:'POST',body:{...command('NEGATIVE-ADJUSTMENT'),warehouseId:warehouse.id,componentId:mount.id,quantity:'1',action:'ADJUSTMENT_OUT'}})).status,409);
 const released=await ok(`/inventory/reservations/${reservation.id}/release`,{role:'WAREHOUSE',method:'POST',body:{...command('RELEASE-A'),version:reservation.version}});assert.equal(released.reservation.status,'RELEASED');assert.equal((await balances()).find(b=>b.componentId===panel.id).availableQuantity,'9');
 const next={...body,...command('RESERVE-B')};reservation=(await ok('/inventory/reservations',{role:'WAREHOUSE',method:'POST',body:next},201)).reservation;
});
test('dispatch posts once, preserves serial traceability and explicitly means warehouse release only',async()=>{
 const body={...command('DISPATCH'),reservationId:reservation.id,version:reservation.version,dispatchedAt:new Date().toISOString(),notes:'TEST ONLY warehouse release; NOT physical site delivery'};
 assert.equal((await request('/inventory/dispatches',{role:'WAREHOUSE',method:'POST',body:{...body,dispatchedAt:new Date(Date.now()+60000).toISOString()}})).status,422);
 const result=await ok('/inventory/dispatches',{role:'WAREHOUSE',method:'POST',body},201);dispatch=result.dispatch;assert.equal(result.scope,'WAREHOUSE_RELEASE_ONLY');assert.equal(dispatch.lines.length,3);const filtered=await ok(`/inventory/dispatches?q=${encodeURIComponent(dispatch.reference)}`);assert.equal(filtered.length,1);assert.equal((await ok(`/inventory/dispatches?q=TEST-NOT-FOUND-${run}`)).length,0);assert.equal((await ok('/inventory/dispatches',{role:'WAREHOUSE',method:'POST',body},201)).dispatch.id,dispatch.id);
 const p=(await balances()).find(b=>b.componentId===panel.id);assert.equal(p.onHandQuantity,'1');assert.equal(p.reservedQuantity,'0');assert.equal(p.availableQuantity,'1');
 const traced=await ok(`/inventory/serials/${serials[0].id}`);assert.equal(traced.state,'DISPATCHED');assert.equal(traced.serialNumber,serials[0].serialNumber);assert.ok(dispatch.lines.some(l=>l.id===traced.dispatchLineId));
 const history=await ok(`/inventory/serials/${serials[0].id}/history`);assert.ok(history.some(e=>e.toState==='RESERVED'));assert.ok(history.some(e=>e.toState==='DISPATCHED'));
 const line=dispatch.lines.find(l=>l.serialUnitIds.length===8);assert.equal((await request('/inventory/returns',{role:'WAREHOUSE',method:'POST',body:{...command('EXCESS-RETURN'),dispatchId:dispatch.id,warehouseId:warehouse.id,lines:[{dispatchLineId:line.id,quantity:'9',serialIds:serials.map(s=>s.id)}]}})).status,409);assert.equal((await db.stockDispatchLine.findUnique({where:{id:line.id}})).returnedQuantity.toString(),'0');
});
test('reorder warnings use actual available stock and warehouse deactivation preserves obligations',async()=>{
 const p=(await balances()).find(b=>b.componentId===panel.id);await ok('/inventory/balances/reorder',{method:'PATCH',body:{...command('REORDER'),warehouseId:warehouse.id,componentId:panel.id,version:p.version,reorderLevel:'2',reorderQuantity:'4'}});const low=await ok(`/inventory/low-stock?warehouseId=${warehouse.id}&componentId=${panel.id}`);assert.equal(low.length,1);assert.equal(low[0].availableQuantity,'1');
 assert.equal((await request(`/inventory/warehouses/${warehouse.id}`,{method:'PATCH',body:{...command('DEACTIVATE-STOCKED'),version:warehouse.version,isActive:false}})).status,409);
 assert.equal((await request('/inventory/balances',{role:'TECHNICIAN'})).status,403);assert.equal((await request(`/inventory/dispatches/${dispatch.id}`,{role:'SALES'})).status,200);
 await writeFile('../.runtime/test-project.json',JSON.stringify({...project,inventory:{warehouse,other,reservation,dispatch,serials}}),{mode:0o600});
});
