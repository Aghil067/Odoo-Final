import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
process.loadEnvFile(resolve('../.runtime/backend.env'));
const target=new URL(process.env.DATABASE_URL);assert.equal(target.hostname,'127.0.0.1');assert.equal(target.port,'55432');assert.equal(target.pathname,'/solar_integration_test');
const fixture=JSON.parse(await readFile('../.runtime/test-accounts.json','utf8')),project=JSON.parse(await readFile('../.runtime/test-project.json','utf8'));assert.equal(fixture.disposable,true);assert.equal(project.disposable,true);
const {app}=await import('../dist/src/app.js'),{db}=await import('../dist/src/lib/db.js');
let server,base,configuration,bom,template;const sessions={},components=[],run=randomUUID();
async function request(path,{role='ADMIN',method='GET',body}={}){const s=sessions[role],headers={Origin:'http://localhost:5173','Content-Type':'application/json'};if(s){headers.Cookie=s.cookie;headers['X-CSRF-Token']=s.csrfToken;}const r=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')};}
async function ok(path,options={},status=200){const r=await request(path,options);assert.equal(r.status,status,JSON.stringify(r.json));return r.json.data;}
before(async()=>{server=app.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}/api`;for(const role of ['ADMIN','ADMIN_REVIEW','SALES','TECHNICIAN']){const r=await request('/auth/login',{role:'NONE',method:'POST',body:{email:fixture.users[role].email,password:fixture.password}});assert.equal(r.status,200);sessions[role]={...r.json.data,cookie:r.cookie.split(';')[0]};}});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));await db.$disconnect();});
const policy={capacityTolerancePercent:'5',minDcAcRatio:'0.9',maxDcAcRatio:'1.2',voltageHeadroomPercent:'5',batteryRequired:false,requiredCategories:['SOLAR_PANEL','INVERTER','MOUNTING_STRUCTURE'],pvInputMode:'INVERTER',basis:'TEST ONLY fictional design policy, not an engineering recommendation'};
test('solar catalog uses real versioned component identities and exact decimal prices',async()=>{
 const inputs=[{sku:`TEST-PANEL-${run}`,name:'TEST ONLY Fictional 400 W Panel',category:'SOLAR_PANEL',unitCost:'100.005',serializationRequired:true,specifications:{ratedPowerW:'400',vmpV:'40',vocV:'49',impA:'10',iscA:'10.5'}},{sku:`TEST-INVERTER-${run}`,name:'TEST ONLY Fictional 3.2 kW Inverter',category:'INVERTER',unitCost:'250.125',serializationRequired:true,specifications:{ratedAcPowerKw:'3.2',maxPvPowerW:'4000',mpptInputs:1,maxDcVoltageV:'600',minMpptVoltageV:'150',maxMpptVoltageV:'500',maxInputCurrentPerMpptA:'20',maxIscPerMpptA:'25',supportedSystemTypes:['ON_GRID'],phase:'SINGLE_PHASE',batterylessSupported:true}},{sku:`TEST-MOUNT-${run}`,name:'TEST ONLY Fictional Mounting Kit',category:'MOUNTING_STRUCTURE',unitCost:'75.01',serializationRequired:false,specifications:{notes:'TEST ONLY fictional mounting data'}}];
 for(const row of inputs)components.push(await ok('/solar/components',{method:'POST',body:{...row,unit:'PCS',currency:'INR',manufacturer:'TEST ONLY synthetic manufacturer',modelNumber:'TEST ONLY fictional model',specificationSource:'TEST ONLY synthetic values for software verification; NOT actual manufacturer data'}},201));
 assert.equal(components[0].unitCost,'100.005');assert.equal(components[0].serializationRequired,true);
 assert.equal((await request('/solar/components',{role:'SALES',method:'POST',body:{...inputs[0],unit:'PCS',currency:'INR'}})).status,403);
 assert.equal((await request('/solar/components',{method:'POST',body:{...inputs[0],unit:'PCS',currency:'INR'}})).status,409);
});
test('template creates an immutable version and configuration pins the exact approved survey',async()=>{
 template=await ok('/solar/templates',{method:'POST',body:{code:`TEST-${run}`,name:'TEST ONLY Fictional On-grid Template',systemType:'ON_GRID',nominalCapacityKw:'3.2',minimumCapacityKw:'3.2',maximumCapacityKw:'3.2',validationPolicy:policy,components:components.map((c,i)=>({componentId:c.id,defaultQuantity:i===0?'8':'1',unit:c.unit,required:true,position:i}))}},201);
 assert.equal((await ok(`/solar/templates/${template.id}/versions/${template.version}`)).version,template.version);
 const input={name:'TEST ONLY Synthetic Solar Design',approvedSurveyId:project.survey.id,approvedSurveyVersion:project.approved.approvedVersion,surveyReviewId:project.approved.reviewId,templateId:template.id,templateVersion:template.version,systemType:'ON_GRID',outputPhase:'SINGLE_PHASE',targetCapacityKw:'3.2',currency:'INR',technicalAssumptions:'TEST ONLY simulated values, no actual engineering approval',reason:'TEST ONLY design verification'};
 assert.equal((await request('/solar/configurations',{method:'POST',body:{...input,approvedSurveyVersion:input.approvedSurveyVersion+1}})).status,409);
 const created=await ok('/solar/configurations',{method:'POST',body:input},201);configuration=created.configuration;bom=created.bom;
 assert.equal(configuration.status,'DRAFT');assert.equal(configuration.approvedSurveyId,project.survey.id);assert.equal(bom.totalEstimatedMaterialCost,'1125.18');assert.ok(created.validation.blockingErrors>0);
 assert.equal((await request(`/solar/configurations/${configuration.id}/submit`,{method:'POST',body:{version:configuration.version,reason:'TEST ONLY incomplete arrays'}})).status,422);
});
test('explicit array design reconciles every panel and yields real compatibility findings',async()=>{
 const design={arrays:[{panelComponentId:components[0].id,deviceComponentId:components[1].id,deviceUnit:1,mpptInput:1,seriesPanels:8,parallelStrings:1,coldVocPerPanelV:'55',hotVmpPerPanelV:'35',maximumVmpPerPanelV:'45',operatingCurrentPerStringA:'11',shortCircuitCurrentPerStringA:'12',basis:'TEST ONLY fictional environmental envelope for software verification'}],batteryBank:null};
 configuration=await ok(`/solar/configurations/${configuration.id}`,{method:'PATCH',body:{version:configuration.version,reason:'TEST ONLY explicit array topology',electricalDesign:design}});
 const report=await ok(`/solar/configurations/${configuration.id}/calculations`);assert.equal(report.blockingErrors,0,JSON.stringify(report));assert.equal(report.calculations.totalPanelDcCapacityKw,'3.2');assert.equal(report.calculations.totalInverterAcCapacityKw,'3.2');assert.equal(report.calculations.totalEstimatedMaterialCost,'1125.18');
 assert.equal((await request(`/solar/configurations/${configuration.id}/bom`,{method:'PUT',body:{version:1,reason:'TEST ONLY stale BOM',lines:components.map((c,i)=>({componentId:c.id,componentVersion:c.version,quantity:i===0?'8':'1',unit:c.unit}))}})).status,409);
});
test('catalog changes invalidate draft compatibility until an explicit BOM refresh',async()=>{
 components[0]=await ok(`/solar/components/${components[0].id}`,{method:'PATCH',body:{version:components[0].version,reason:'TEST ONLY updated fictional material price',unitCost:'100.015'}});
 const report=await ok(`/solar/configurations/${configuration.id}/calculations`);assert.ok(report.findings.some(f=>f.code==='CATALOG_CHANGED'));
 assert.equal((await request(`/solar/configurations/${configuration.id}/submit`,{method:'POST',body:{version:configuration.version,reason:'TEST ONLY stale catalog'}})).status,422);
 const refreshed=await ok(`/solar/configurations/${configuration.id}/bom/generate`,{method:'POST',body:{version:configuration.version,reason:'TEST ONLY explicit refresh to current catalog'}});configuration=refreshed.configuration;bom=refreshed.bom;assert.equal(bom.totalEstimatedMaterialCost,'1125.26');assert.equal(refreshed.validation.blockingErrors,0);
});
test('independent review pins immutable configuration/BOM snapshots for M04 and M09',async()=>{
 configuration=await ok(`/solar/configurations/${configuration.id}/submit`,{method:'POST',body:{version:configuration.version,reason:'TEST ONLY submit fictional design'}});
 const checklist={compatibilityReviewed:true,costingReviewed:true,assumptionsReviewed:true,surveyConditionsAcknowledged:true,designLimitationsAcknowledged:true};
 assert.equal((await request(`/solar/configurations/${configuration.id}/review`,{method:'POST',body:{version:configuration.version,decision:'APPROVED',notes:'TEST ONLY self review forbidden',checklist}})).status,403);
 const reviewed=await ok(`/solar/configurations/${configuration.id}/review`,{role:'ADMIN_REVIEW',method:'POST',body:{version:configuration.version,decision:'APPROVED',notes:'TEST ONLY independent simulated design review, not actual certification',checklist}});configuration=reviewed.configuration;
 const approved=await ok(`/solar/configurations/${configuration.id}/approved`);assert.equal(approved.configuration.customerId,project.customer.id);assert.equal(approved.configurationId,configuration.id);assert.equal(approved.bom.id,bom.id);
 assert.equal((await request(`/solar/configurations/${configuration.id}`,{method:'PATCH',body:{version:configuration.version,reason:'TEST ONLY immutable check',name:'Must not overwrite approved design'}})).status,409);
 assert.equal((await db.solarConfiguration.findUnique({where:{id:configuration.id}})).status,'APPROVED');
 await writeFile('../.runtime/test-project.json',JSON.stringify({...project,components,template,configuration,bom,approvedConfiguration:approved}),{mode:0o600});
});
