import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {expect} from '@playwright/test';

// Synthetic prerequisites are created through the actual HTTP workflows, not by
// assigning approved statuses in the database. Only the test login is provisioned directly.
export async function fulfillmentFixture(){
 const accounts=JSON.parse(readFileSync('.runtime/test-accounts.json','utf8')),source=JSON.parse(readFileSync('.runtime/test-project.json','utf8'));
 if(accounts.disposable!==true||source.disposable!==true||!source.configuration)throw new Error('Disposable integration fixtures required');
 const databaseUrl=readFileSync('.runtime/backend.env','utf8').split(/\r?\n/).find(line=>line.startsWith('DATABASE_URL='))!.slice(13),target=new URL(databaseUrl);
 if(target.hostname!=='127.0.0.1'||target.port!=='55432'||target.pathname!=='/solar_integration_test')throw new Error('Refusing a non-disposable database');
 const {PrismaClient}=createRequire(import.meta.url)('../../backend/node_modules/@prisma/client'),db=new PrismaClient({datasources:{db:{url:databaseUrl}}}),run=randomUUID();
 let technician,outsider;
 try{technician=await db.user.create({data:{email:`test-fulfillment-tech-${run}@integration.example.test`,name:'TEST ONLY Fulfillment Technician',passwordHash:accounts.users.TECHNICIAN.passwordHash,role:'TECHNICIAN'}});outsider=await db.user.create({data:{email:`test-other-sales-${run}@integration.example.test`,name:'TEST ONLY Other Sales',passwordHash:accounts.users.TECHNICIAN.passwordHash,role:'SALES'}});}finally{await db.$disconnect();}
 const sessions:Record<string,{cookie:string;csrfToken:string}>={},base='http://127.0.0.1:3000/api';
 for(const role of ['ADMIN','ADMIN_REVIEW','SALES','TECHNICIAN','WAREHOUSE']){const response=await fetch(base+'/auth/login',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:JSON.stringify({email:role==='TECHNICIAN'?technician.email:accounts.users[role].email,password:accounts.password})});const result=await response.json();expect(response.status,JSON.stringify(result)).toBe(200);sessions[role]={cookie:response.headers.get('set-cookie')!.split(';')[0],csrfToken:result.data.csrfToken};}
 async function request(path:string,method='GET',body?:unknown,role='ADMIN'){
  const session=sessions[role],response=await fetch(base+path,{method,headers:{Origin:'http://localhost:5173',Cookie:session.cookie,'X-CSRF-Token':session.csrfToken,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)}),result=await response.json();expect(response.ok,JSON.stringify(result)).toBe(true);return result.data;
 }
 const customer=await request('/customers','POST',{name:'TEST ONLY Fulfillment Customer '+run,type:'INDIVIDUAL',phone:'+14155552671'},'SALES'),site=await request(`/customers/${customer.id}/sites`,'POST',{name:'TEST ONLY Fulfillment Site',addressLine1:'1 Synthetic Fulfillment Street',city:'Test City',state:'Test State',postalCode:'10001',country:'US'},'SALES');
 let lead=await request('/leads','POST',{customerId:customer.id,siteId:site.id,source:'WEBSITE',priority:'MEDIUM',preferredSystemType:'ON_GRID',requestedCapacityKw:'3.2',qualificationNotes:'TEST ONLY simulated requirements'},'SALES');
 for(const status of ['CONTACTED','QUALIFIED','SURVEY_REQUESTED'])lead=await request(`/leads/${lead.id}/status`,'POST',{version:lead.version,status,reason:'TEST ONLY synthetic lead qualification'},'SALES');
 let survey=await request('/surveys','POST',{leadId:lead.id,siteId:site.id,requestNotes:'TEST ONLY synthetic fulfillment inspection'},'SALES');
 survey=await request(`/surveys/${survey.id}/assign`,'POST',{version:survey.version,assignedToId:technician.id,reason:'TEST ONLY assign isolated synthetic visit'});
 survey=await request(`/surveys/${survey.id}/schedule`,'POST',{version:survey.version,scheduledAt:new Date(Date.now()+1000).toISOString(),expectedDurationMinutes:15,reason:'TEST ONLY appointment'});await new Promise(resolve=>setTimeout(resolve,1200));
 survey=await request(`/surveys/${survey.id}/start`,'POST',{version:survey.version,reason:'TEST ONLY start during confirmed visit'},'TECHNICIAN');
 function fields(record:Record<string,unknown>,keys:string[]){return Object.fromEntries(keys.map(k=>{if(record[k]===undefined)throw new Error('Synthetic prerequisite lacks '+k);return [k,record[k]];}));}
 const snapshot=source.approved.snapshot;
 const roof=fields(snapshot.roofAssessment,['roofType','roofTypeDetails','usableAreaSqm','azimuthDegrees','tiltDegrees','shadingLevel','shadingObservations','nearbyObstructions','mountingSpaceSqm','accessibility','accessibilityNotes','visibleCondition','conditionNotes','mountingConcerns','structuralNotes','specialistVerificationRequired','recommendations']);
 survey.version=(await request(`/surveys/${survey.id}/roof-assessment`,'PUT',{version:survey.version,...roof},'TECHNICIAN')).surveyVersion;
 const electrical=fields(snapshot.electricalAssessment,['gridConnection','supplyPhase','meterDetails','panelPresent','panelObservations','approximateCableRunMeters','earthingObservations','inverterPlacementOptions','batteryPlacementConsiderations','safetyConcerns','safetyVerificationRequired','gridSuitabilityObservations','additionalNotes']);
 survey.version=(await request(`/surveys/${survey.id}/electrical-assessment`,'PUT',{version:survey.version,...electrical},'TECHNICIAN')).surveyVersion;
 survey=await request(`/surveys/${survey.id}`,'PATCH',{version:survey.version,recommendedCapacityKw:'3.2',recommendedSystemType:'ON_GRID',suitability:'SUITABLE',technicalAssumptions:'TEST ONLY synthetic assessment for software verification',feasibilityNotes:'TEST ONLY no actual electrical certification'},'TECHNICIAN');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9N0AAAAASUVORK5CYII=','base64');
 for(const category of ['ROOF_PHOTO','METER_PHOTO','PANEL_PHOTO']){const s=sessions.TECHNICIAN,response=await fetch(`${base}/surveys/${survey.id}/attachments?version=${survey.version}&category=${category}&fileName=TEST_ONLY_fixture_${category}.png`,{method:'POST',headers:{Origin:'http://localhost:5173',Cookie:s.cookie,'X-CSRF-Token':s.csrfToken,'Content-Type':'image/png'},body:png});const result=await response.json();expect(response.status,JSON.stringify(result)).toBe(201);survey.version=result.data.surveyVersion;}
 survey=await request(`/surveys/${survey.id}/submit`,'POST',{version:survey.version,reason:'TEST ONLY submit synthetic findings'},'TECHNICIAN');
 await request(`/surveys/${survey.id}/review`,'POST',{version:survey.version,decision:'APPROVED',notes:'TEST ONLY synthetic internal review',checklist:{roofReviewed:true,electricalReviewed:true,evidenceReviewed:true,assumptionsReviewed:true,limitationsAcknowledged:true,conditionalWorkAcknowledged:false}},'ADMIN_REVIEW');
 const handoff=await request(`/surveys/${survey.id}/approved`),name='TEST ONLY Fulfillment Design '+run;
 let configuration=(await request('/solar/configurations','POST',{name,approvedSurveyId:survey.id,approvedSurveyVersion:handoff.approvedVersion,surveyReviewId:handoff.reviewId,templateId:source.template.id,templateVersion:source.template.version,systemType:'ON_GRID',outputPhase:'SINGLE_PHASE',targetCapacityKw:'3.2',currency:'INR',technicalAssumptions:'TEST ONLY synthetic design, not an engineering recommendation',electricalDesign:source.configuration.electricalDesign,reason:'TEST ONLY isolated fulfillment design'})).configuration;
 configuration=await request(`/solar/configurations/${configuration.id}/submit`,'POST',{version:configuration.version,reason:'TEST ONLY validated synthetic design'});
 configuration=(await request(`/solar/configurations/${configuration.id}/review`,'POST',{version:configuration.version,decision:'APPROVED',notes:'TEST ONLY independent synthetic design review',checklist:{compatibilityReviewed:true,costingReviewed:true,assumptionsReviewed:true,surveyConditionsAcknowledged:true,designLimitationsAcknowledged:true}},'ADMIN_REVIEW')).configuration;
 const warehouses=[];for(const suffix of ['A','B'])warehouses.push(await request('/inventory/warehouses','POST',{idempotencyKey:randomUUID(),reference:`TEST-FULFILL-WH-${suffix}-${run}`,reason:'TEST ONLY isolated fulfillment warehouse',code:`TEST-FULFILL-${suffix}-${run}`,name:`TEST ONLY Fulfillment Warehouse ${suffix} ${run}`,address:'TEST ONLY synthetic warehouse address'}));
 const serialNumbers:Record<string,string[]>={};
 for(const [index,c] of source.components.entries()){const quantity=index===0?'8':'1',numbers=c.serializationRequired?Array.from({length:index===0?8:1},(_,i)=>`TEST-FULFILL-${run}-${index}-${i}`.toUpperCase()):[];serialNumbers[c.id]=numbers;await request('/inventory/receipts','POST',{idempotencyKey:randomUUID(),reference:`TEST-FULFILL-RECEIPT-${index}-${run}`,reason:'TEST ONLY synthetic warehouse receipt',warehouseId:warehouses[0].id,componentId:c.id,quantity,receivedAt:new Date().toISOString(),serialNumbers:numbers},'WAREHOUSE');}
 return {configuration,warehouses,components:source.components,serialNumbers,run,outsider};
}
