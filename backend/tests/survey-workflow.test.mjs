import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
process.loadEnvFile(resolve('../.runtime/backend.env'));
const target=new URL(process.env.DATABASE_URL);
assert.equal(target.hostname,'127.0.0.1');assert.equal(target.port,'55432');assert.equal(target.pathname,'/solar_integration_test');
const fixture=JSON.parse(await readFile('../.runtime/test-accounts.json','utf8'));assert.equal(fixture.disposable,true);
const {app}=await import('../dist/src/app.js'),{db}=await import('../dist/src/lib/db.js');
let server,base,customer,site,lead,survey,uploaded,approved;const sessions={},run=randomUUID();
async function request(path,{role='ADMIN',method='GET',body,file,type,csrf=true}={}){
 const session=sessions[role],headers={Origin:'http://localhost:5173'};
 if(session){headers.Cookie=session.cookie;if(csrf)headers['X-CSRF-Token']=session.csrfToken;}
 if(body!==undefined)headers['Content-Type']='application/json';if(file)headers['Content-Type']=type;
 const r=await fetch(base+path,{method,headers,body:file??(body===undefined?undefined:JSON.stringify(body))});
 const json=r.headers.get('content-type')?.includes('application/json')?await r.json():await r.arrayBuffer();return {status:r.status,json,cookie:r.headers.get('set-cookie'),headers:r.headers};
}
async function ok(path,options={},status=200){const r=await request(path,options);assert.equal(r.status,status,JSON.stringify(r.json));return r.json.data;}
async function command(action,role='ADMIN',extra={}){survey=await ok(`/surveys/${survey.id}/${action}`,{method:'POST',role,body:{version:survey.version,reason:'TEST ONLY synthetic workflow verification',...extra}});return survey;}
before(async()=>{fixture.users.TECHNICIAN=await db.user.create({data:{email:`test-api-surveyor-${run}@integration.example.test`,name:'TEST ONLY API Surveyor',passwordHash:fixture.users.TECHNICIAN.passwordHash,role:'TECHNICIAN'}});server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;for(const role of ['ADMIN','ADMIN_REVIEW','SALES','TECHNICIAN','WAREHOUSE']){const r=await request('/auth/login',{role:'NONE',method:'POST',body:{email:fixture.users[role].email,password:fixture.password}});assert.equal(r.status,200);sessions[role]={...r.json.data,cookie:r.cookie.split(';')[0]};}});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await db.$disconnect();});
test('survey creation requires an eligible lead and never invents an appointment',async()=>{
 customer=await ok('/customers',{role:'SALES',method:'POST',body:{name:`TEST ONLY Survey ${run}`,type:'INDIVIDUAL',phone:'+14155552671'}},201);
 site=await ok(`/customers/${customer.id}/sites`,{role:'SALES',method:'POST',body:{name:'TEST ONLY Rooftop',addressLine1:'1 Synthetic Survey Street',city:'Test City',state:'Test State',postalCode:'10001',country:'US'}},201);
 lead=await ok('/leads',{role:'SALES',method:'POST',body:{customerId:customer.id,siteId:site.id,source:'WEBSITE',priority:'MEDIUM',preferredSystemType:'ON_GRID',requestedCapacityKw:'3.200',qualificationNotes:'TEST ONLY synthetic requirements'}},201);
 assert.equal((await request('/surveys',{role:'SALES',method:'POST',body:{leadId:lead.id,siteId:site.id,requestNotes:'TEST ONLY request'}})).status,409);
 for(const status of ['CONTACTED','QUALIFIED','SURVEY_REQUESTED'])lead=await ok(`/leads/${lead.id}/status`,{role:'SALES',method:'POST',body:{version:lead.version,status,reason:'TEST ONLY qualified synthetic lead'}});
 survey=await ok('/surveys',{role:'SALES',method:'POST',body:{leadId:lead.id,siteId:site.id,requestNotes:'TEST ONLY synthetic survey, no real electrical assessment'}},201);
 assert.equal(survey.status,'REQUESTED');assert.equal(survey.scheduledAt,null);assert.equal(survey.assignedToId,null);
 assert.equal((await request('/surveys',{role:'SALES',method:'POST',body:{leadId:lead.id,siteId:site.id,requestNotes:'TEST ONLY duplicate'}})).status,403);
 const list=await ok(`/surveys?customerId=${customer.id}`);assert.equal(list[0].customer.name,customer.name);assert.equal(list[0].site.name,site.name);
});
test('survey scheduling requires assignment, rejects stale writes and blocks early starts',async()=>{
 assert.equal((await request(`/surveys/${survey.id}/schedule`,{method:'POST',body:{version:survey.version,scheduledAt:new Date(Date.now()+60000).toISOString(),expectedDurationMinutes:15,reason:'TEST ONLY'}})).status,422);
 await command('assign','ADMIN',{assignedToId:fixture.users.TECHNICIAN.id});
 assert.equal((await request(`/surveys/${survey.id}/assign`,{method:'POST',body:{version:1,assignedToId:fixture.users.TECHNICIAN.id,reason:'TEST ONLY stale'}})).status,409);
 await command('schedule','ADMIN',{scheduledAt:new Date(Date.now()+1500).toISOString(),expectedDurationMinutes:15});
 assert.equal((await request(`/surveys/${survey.id}/start`,{role:'TECHNICIAN',method:'POST',body:{version:survey.version,reason:'TEST ONLY too early'}})).status,409);
 await new Promise(r=>setTimeout(r,1600));await command('start','TECHNICIAN');assert.equal(survey.status,'IN_PROGRESS');
});
test('field findings are assigned-technician only and incomplete submissions are blocked',async()=>{
 assert.equal((await request(`/surveys/${survey.id}`,{role:'SALES',method:'PATCH',body:{version:survey.version,suitability:'SUITABLE'}})).status,403);
 assert.equal((await request(`/surveys/${survey.id}/submit`,{role:'TECHNICIAN',method:'POST',body:{version:survey.version,reason:'TEST ONLY missing data'}})).status,422);
 const roof={roofType:'RCC',roofTypeDetails:null,usableAreaSqm:'40.000',mountingSpaceSqm:'30.000',azimuthDegrees:'180',tiltDegrees:'20',shadingLevel:'NONE',shadingObservations:'TEST ONLY simulated unshaded roof',nearbyObstructions:'TEST ONLY none in synthetic fixture',accessibility:'ACCESSIBLE',accessibilityNotes:'TEST ONLY synthetic safe access',visibleCondition:'GOOD',conditionNotes:'TEST ONLY synthetic roof condition',mountingConcerns:'TEST ONLY no simulated concerns',structuralNotes:'TEST ONLY no structural certification',specialistVerificationRequired:false,recommendations:'TEST ONLY synthetic design review required'};
 const r=await ok(`/surveys/${survey.id}/roof-assessment`,{role:'TECHNICIAN',method:'PUT',body:{version:survey.version,...roof}});survey.version=r.surveyVersion;
 const electrical={gridConnection:'CONNECTED',supplyPhase:'SINGLE_PHASE',meterDetails:'TEST ONLY simulated meter',panelPresent:true,panelObservations:'TEST ONLY simulated panel',approximateCableRunMeters:'12.500',earthingObservations:'TEST ONLY no actual measurement or certification',inverterPlacementOptions:'TEST ONLY synthetic placement',batteryPlacementConsiderations:null,safetyConcerns:'TEST ONLY simulated conditions',safetyVerificationRequired:false,gridSuitabilityObservations:'TEST ONLY no utility permission implied',additionalNotes:'TEST ONLY do not use as an electrical record'};
 const e=await ok(`/surveys/${survey.id}/electrical-assessment`,{role:'TECHNICIAN',method:'PUT',body:{version:survey.version,...electrical}});survey.version=e.surveyVersion;
 survey=await ok(`/surveys/${survey.id}`,{role:'TECHNICIAN',method:'PATCH',body:{version:survey.version,recommendedCapacityKw:'3.200',recommendedSystemType:'ON_GRID',suitability:'SUITABLE',technicalAssumptions:'TEST ONLY fabricated scenario for API verification',feasibilityNotes:'TEST ONLY not a real technical assessment'}});
 assert.equal((await request(`/surveys/${survey.id}/submit`,{role:'TECHNICIAN',method:'POST',body:{version:survey.version,reason:'TEST ONLY missing evidence'}})).status,422);
});
test('private evidence validates type, CSRF, identity and protected byte-for-byte downloads',async()=>{
 const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9N0AAAAASUVORK5CYII=','base64');
 const path=()=>`/surveys/${survey.id}/attachments?version=${survey.version}&category=ROOF_PHOTO&fileName=TEST_ONLY.png`;
 assert.equal((await request(path(),{role:'TECHNICIAN',method:'POST',file:bytes,type:'image/png',csrf:false})).status,403);
 assert.equal((await request(path(),{role:'TECHNICIAN',method:'POST',file:Buffer.from('not an image'),type:'image/png'})).status,422);
 for(const category of ['ROOF_PHOTO','METER_PHOTO','PANEL_PHOTO']){const r=await ok(`/surveys/${survey.id}/attachments?version=${survey.version}&category=${category}&fileName=TEST_ONLY_${category}.png`,{role:'TECHNICIAN',method:'POST',file:bytes,type:'image/png'},201);survey.version=r.surveyVersion;uploaded=r.attachment;assert.equal(uploaded.storageKey,undefined);assert.match(uploaded.sha256,/^[a-f0-9]{64}$/);}
 const download=await request(`/surveys/${survey.id}/attachments/${uploaded.id}/download`,{role:'TECHNICIAN'});assert.equal(download.status,200);assert.deepEqual(Buffer.from(download.json),bytes);
 assert.equal((await request(`/surveys/${survey.id}/attachments/${uploaded.id}/download`,{role:'WAREHOUSE'})).status,403);
 assert.equal((await request(`/surveys/${survey.id}/attachments/${randomUUID()}/download`)).status,404);
});
test('submission, checklist review, approved snapshot and terminal immutability persist',async()=>{
 await command('submit','TECHNICIAN');assert.equal(survey.status,'SUBMITTED');
 assert.equal((await request(`/surveys/${survey.id}/review`,{role:'TECHNICIAN',method:'POST',body:{version:survey.version,decision:'APPROVED',notes:'TEST ONLY unauthorized'}})).status,403);
 assert.equal((await request(`/surveys/${survey.id}/review`,{method:'POST',body:{version:survey.version,decision:'APPROVED',notes:'TEST ONLY incomplete review'}})).status,422);
 const reviewed=await ok(`/surveys/${survey.id}/review`,{role:'ADMIN_REVIEW',method:'POST',body:{version:survey.version,decision:'APPROVED',notes:'TEST ONLY synthetic internal preliminary review',checklist:{roofReviewed:true,electricalReviewed:true,evidenceReviewed:true,assumptionsReviewed:true,limitationsAcknowledged:true,conditionalWorkAcknowledged:false}}});
 survey=reviewed.survey;approved=await ok(`/surveys/${survey.id}/approved`);assert.equal(approved.reviewId,reviewed.review.id);assert.equal(approved.approvalScope,'INTERNAL_PRELIMINARY_FEASIBILITY');assert.equal(approved.snapshot.attachments.length,3);
 assert.equal((await request(`/surveys/${survey.id}`,{role:'TECHNICIAN',method:'PATCH',body:{version:survey.version,feasibilityNotes:'TEST ONLY must not mutate approval'}})).status,409);
 const persisted=await db.siteSurvey.findUnique({where:{id:survey.id}});assert.equal(persisted.status,'APPROVED');const history=await ok(`/surveys/${survey.id}/history`);assert.ok(history.some(h=>h.event==='REVIEWED'));assert.ok(history.some(h=>h.event==='ATTACHMENT_ADDED'));
 await writeFile('../.runtime/test-project.json',JSON.stringify({disposable:true,customer,site,lead,survey,approved}),{mode:0o600});
});
