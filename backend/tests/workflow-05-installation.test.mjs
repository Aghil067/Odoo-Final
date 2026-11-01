import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
process.loadEnvFile(resolve('../.runtime/backend.env'));
const target=new URL(process.env.DATABASE_URL);
assert.equal(target.hostname,'127.0.0.1');assert.equal(target.port,'55432');assert.equal(target.pathname,'/solar_integration_test');
const fixture=JSON.parse(await readFile('../.runtime/test-accounts.json','utf8'));
const project=JSON.parse(await readFile('../.runtime/test-project.json','utf8'));
assert.equal(fixture.disposable,true);assert.equal(project.disposable,true);assert.ok(project.inventory.dispatch);
const {app}=await import('../dist/src/app.js'),{db}=await import('../dist/src/lib/db.js');
const sessions={},run=randomUUID(),reason='TEST ONLY synthetic installation verification; not electrical certification';
const types=['VISUAL_INSPECTION','MOUNTING_VERIFICATION','POLARITY','EARTHING','INSULATION','INVERTER_STARTUP','PROTECTION_DEVICES','BATTERY','FUNCTIONAL_SYSTEM'];
const testRequirements=types.map(type=>({type,required:type!=='BATTERY',basis:`TEST ONLY simulated ${type} acceptance; NOT manufacturer specifications`,measurementRequired:type==='INSULATION',unit:type==='INSULATION'?'MOhm':null}));
let server,base,job,evidenceId,technician,equipment;
async function request(path,{role='ADMIN',method='GET',body,bytes}={}){
 const s=sessions[role],headers={Origin:'http://localhost:5173','Content-Type':bytes?'image/png':'application/json'};
 if(s){headers.Cookie=s.cookie;headers['X-CSRF-Token']=s.csrfToken;}
 const r=await fetch(base+path,{method,headers,body:bytes??(body===undefined?undefined:JSON.stringify(body))});
 return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')};
}
async function ok(path,options={},status=200){const r=await request(path,options);assert.equal(r.status,status,JSON.stringify(r.json));return r.json.data;}
const path=()=>`/installations/${job.id}`;
const command=(extra={})=>({version:job.version,reason,...extra});
async function change(route,extra={},method='POST',role='ADMIN',status=200){const result=await ok(path()+route,{method,role,body:command(extra)},status);job=result.job??result;return result;}
before(async()=>{
 technician=await db.user.create({data:{name:'TEST ONLY installation technician',email:`installation-${run}@integration.example.test`,role:'TECHNICIAN',passwordHash:fixture.users.TECHNICIAN.passwordHash}});
 server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;
 for(const role of ['ADMIN','ADMIN_REVIEW','TECHNICIAN','WAREHOUSE','FINANCE','SUPPORT']){
  const r=await request('/auth/login',{role:'NONE',method:'POST',body:{email:fixture.users[role].email,password:fixture.password}});assert.equal(r.status,200);sessions[role]={...r.json.data,cookie:r.cookie.split(';')[0]};
 }
});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await db.$disconnect();});
test('installation pins the approved design and warehouse release without fabricating delivery',async()=>{
 const input={name:`TEST ONLY installation ${run}`,dispatchId:project.inventory.dispatch.id,reservationId:project.inventory.reservation.id,configurationId:project.configuration.id,configurationApprovedVersion:project.approvedConfiguration.approvedVersion,configurationReviewId:project.approvedConfiguration.reviewId,bomId:project.bom.id,bomVersion:project.bom.version,coordinatorId:fixture.users.ADMIN.id,technicianIds:[technician.id],plannedStartAt:new Date(Date.now()+86400000).toISOString(),plannedEndAt:new Date(Date.now()+90000000).toISOString(),testRequirements,reason};
 assert.equal((await request('/installations',{method:'POST',body:{...input,bomVersion:input.bomVersion+1}})).status,409);
 assert.equal((await request('/installations',{role:'TECHNICIAN',method:'POST',body:input})).status,403);
 job=await ok('/installations',{method:'POST',body:input},201);assert.equal(job.status,'PLANNED');assert.equal(job.deliveryConfirmedAt,null);assert.equal(job.handoffSnapshot,undefined);
 assert.equal((await request('/installations',{method:'POST',body:input})).status,409);
 assert.equal((await request(path(),{role:'TECHNICIAN'})).status,404,'Unassigned technicians cannot read the job');
 assert.equal((await request(path(),{role:'WAREHOUSE'})).status,403);assert.equal((await ok(path()+'/equipment-reference',{role:'WAREHOUSE'})).dispatchId,input.dispatchId);
 assert.equal((await request(path(),{role:'SUPPORT'})).status,403);
 assert.equal((await request(path()+'/start',{method:'POST',body:command()})).status,409);
});
test('physical receipt and explicit safety evidence are separate prerequisites with versioned writes',async()=>{
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9N0AAAAASUVORK5CYII=','base64');
 const upload=await ok(path()+'/attachments?'+new URLSearchParams({version:String(job.version),reason,category:'COMPLETION',fileName:'TEST-ONLY-synthetic-evidence.png'}),{method:'POST',bytes:png},201);evidenceId=upload.attachment.id;job.version=upload.jobVersion;assert.equal(upload.attachment.storageKey,undefined);assert.equal(upload.attachment.sha256.length,64);
 const readiness={checklist:{siteAccessConfirmed:true,installationAreaAccessible:true,roofSiteConditionChecked:true,safetyMeasuresAvailable:true,surveyLimitationsReviewed:true,conditionalWorkAddressed:true},notes:reason,conditionalWorkResolution:'TEST ONLY no additional synthetic conditions',outstandingIssues:null,evidenceIds:[evidenceId]};
 await change('/site-readiness',readiness);assert.equal(job.status,'PLANNED');assert.equal(job.deliveryConfirmedAt,null);
 const detail=await ok(path());equipment=detail.equipment;
 const lines=equipment.map(e=>({equipmentId:e.id,receivedQuantity:e.dispatchedQuantity,damagedQuantity:'0',receivedSerialIds:e.serials.map(s=>s.serialUnitId),damagedSerialIds:[]}));
 assert.equal((await request(path()+'/confirm-receipt',{method:'POST',body:command({receivedAt:new Date().toISOString(),notes:reason,evidenceIds:[evidenceId],lines:lines.slice(1)})})).status,422);
 await change('/confirm-receipt',{receivedAt:new Date().toISOString(),notes:reason,evidenceIds:[evidenceId],lines});assert.equal(job.status,'SITE_READY');assert.ok(job.deliveryConfirmedAt);
 const oldVersion=job.version;await change('/start');assert.equal(job.status,'IN_PROGRESS');
 assert.equal((await request(path(),{method:'PATCH',body:{version:oldVersion,reason,completionNotes:'Stale write must fail'}})).status,409);
});
test('blockers require explicit resolution and installation preserves exact dispatched serial identities',async()=>{
 const {issue}=await change('/issues',{type:'ELECTRICAL_SAFETY',severity:'CRITICAL',blocking:false,description:reason,evidenceIds:[evidenceId]},'POST','ADMIN',201);assert.equal(issue.blocking,true);
 const first=equipment[0],install={equipmentId:first.id,installedQuantity:first.dispatchedQuantity,installedSerialIds:first.serials.map(s=>s.serialUnitId),installedLocation:'TEST ONLY fictional mounting position',notes:reason,evidenceIds:[evidenceId]};
 assert.equal((await request(path()+'/equipment/install',{method:'POST',body:command(install)})).status,409);
 assert.equal((await request(path()+`/issues/${issue.id}`,{role:'TECHNICIAN',method:'PATCH',body:command({status:'RESOLVED',resolution:reason,evidenceIds:[evidenceId]})})).status,404);
 await change(`/issues/${issue.id}`,{status:'RESOLVED',resolution:reason,evidenceIds:[evidenceId]},'PATCH');
 const serialized=equipment.find(e=>e.serializationRequired);
 assert.equal((await request(path()+'/equipment/install',{method:'POST',body:command({...install,equipmentId:serialized.id,installedQuantity:serialized.dispatchedQuantity,installedSerialIds:[randomUUID()]})})).status,422);
 for(const e of equipment)await change('/equipment/install',{...install,equipmentId:e.id,installedQuantity:e.dispatchedQuantity,installedSerialIds:e.serials.map(s=>s.serialUnitId)});
 const line=project.inventory.dispatch.lines.find(l=>l.id===serialized.dispatchLineId);
 const returned=await request('/inventory/returns',{role:'WAREHOUSE',method:'POST',body:{idempotencyKey:`TEST-INSTALLED-RETURN-${run}`,reference:`TEST-INSTALLED-RETURN-${run}`,reason,dispatchId:project.inventory.dispatch.id,warehouseId:project.inventory.warehouse.id,lines:[{dispatchLineId:line.id,quantity:'1',serialIds:[serialized.serials[0].serialUnitId]}]}});
 assert.equal(returned.status,409,JSON.stringify(returned.json));assert.equal((await db.stockDispatchLine.findUniqueOrThrow({where:{id:line.id}})).returnedQuantity.toString(),'0');
 assert.equal((await request(path()+'/cancel',{method:'POST',body:command()})).status,409);
});
test('completion requires checked milestones, actual notes, and the complete required test plan',async()=>{
 const milestones=await ok(path()+'/milestones');
 for(const milestone of milestones){
  const body={status:milestone.required?'COMPLETED':'NOT_APPLICABLE',responsibleUserId:technician.id,plannedStartAt:null,plannedEndAt:null,checks:{approvedDesignFollowed:true,safetyChecked:true,evidenceReviewed:true},completionNotes:reason,evidenceIds:[evidenceId]};
  if(milestone.required)assert.equal((await request(path()+`/milestones/${milestone.id}`,{method:'PUT',body:command({...body,checks:{...body.checks,safetyChecked:false}})})).status,409);
  await change(`/milestones/${milestone.id}`,body,'PUT');
 }
 assert.equal((await request(path()+'/submit-completion',{method:'POST',body:command()})).status,409);
 await change('',{completionNotes:reason},'PATCH');await change('/submit-completion');assert.equal(job.status,'WORK_COMPLETED');await change('/begin-testing');assert.equal(job.status,'TESTING');
 assert.equal((await request(path()+'/submit-commissioning',{method:'POST',body:command()})).status,409);
 for(const requirement of testRequirements.filter(r=>r.required)){
  const record={type:requirement.type,applicable:true,result:'PASS',observations:reason,measurement:requirement.measurementRequired?'123':null,unit:requirement.unit,requirementsBasis:requirement.basis,notApplicableReason:null,notes:'TEST ONLY fabricated measurement for isolated software test, not a real field reading',evidenceIds:[evidenceId]};
  if(requirement.measurementRequired)assert.equal((await request(path()+'/tests',{method:'POST',body:command({...record,measurement:null,unit:null})})).status,422);
  await change('/tests',record,'POST','ADMIN',201);
 }
 await change('/submit-commissioning');assert.equal(job.status,'COMMISSIONING_REVIEW');
});
test('independent commissioning produces immutable internal handoff with separate receipt and review timestamps',async()=>{
 const checklist={siteReceiptVerified:true,milestonesReviewed:true,equipmentReconciled:true,testsReviewed:true,conditionsAddressed:true,evidenceReviewed:true,internalScopeAcknowledged:true};
 assert.equal((await request(path()+'/review',{method:'POST',body:command({decision:'APPROVED',checklist,notes:reason})})).status,403);
 await change('/review',{decision:'APPROVED',checklist,notes:reason},'POST','ADMIN_REVIEW');assert.equal(job.status,'COMMISSIONED');
 const handoff=await ok(path()+'/commissioned');assert.equal(handoff.scope,'INTERNAL_COMMISSIONING_NOT_REGULATORY_CERTIFICATION');assert.equal(handoff.externalGridAuthorization,'NOT_RECORDED');assert.equal(handoff.warrantyStartDate,'NOT_DETERMINED_BY_M05');assert.ok(handoff.deliveryConfirmedAt);assert.ok(handoff.commissioningDate);assert.equal(handoff.equipment.length,equipment.length);assert.equal(handoff.testSummary.length,8);
 assert.equal((await request(path(),{method:'PATCH',body:command({completionNotes:'Cannot rewrite commissioned history'})})).status,409);
 assert.equal((await request(path()+'/start',{method:'POST',body:command()})).status,409);
 assert.equal((await ok(path(),{role:'FINANCE'})).status,'COMMISSIONED');assert.equal((await request(path()+'/attachments',{role:'FINANCE'})).status,403);
 const history=await ok(path()+'/history?pageSize=100');assert.ok(history.every(h=>h.actorId&&h.reason&&h.jobVersion));
 await writeFile('../.runtime/test-project.json',JSON.stringify({...project,installation:{job,handoff,technicianId:technician.id,evidenceId}}),{mode:0o600});
});
