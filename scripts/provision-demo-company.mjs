// Explicit operator-run fictional company provisioning through the live HTTP API.
// No Prisma imports, database writes, automatic startup hook, or seed fallback.
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const root=new URL('../',import.meta.url);
const descriptor=JSON.parse(await fs.readFile(new URL('.runtime/test-database.json',root),'utf8'));
if(process.env.ALLOW_FICTIONAL_DEMO!=='true'||descriptor.disposable!==true||descriptor.database!=='solar_integration_test'||descriptor.port!==55432)throw new Error('Explicit permission and the isolated local database descriptor are required');
const credentials=JSON.parse(await fs.readFile(new URL('.runtime/test-accounts.json',root),'utf8'));
const base='http://127.0.0.1:3000/api',origin='http://localhost:5173';
const manifest=new URL('.runtime/demo-company.json',root);let state;
try{state=JSON.parse(await fs.readFile(manifest,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;state={disposable:true,run:randomUUID(),records:{}};}
if(state.disposable!==true)throw new Error('Unrecognized demo manifest');
const reason='DEMO ONLY: fictional HelioNest Solar Solutions scenario; no real field inspection, payment or certification';
const sessionFile=new URL('.runtime/demo-api-sessions.json',root);
let sessions={};try{sessions=JSON.parse(await fs.readFile(sessionFile,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
async function api(route,body,role='ADMIN',method=body===undefined?'GET':'POST',bytes){
 const s=sessions[role],headers={Origin:origin,'Content-Type':bytes?'image/png':'application/json'};
 if(s){headers.Cookie=s.cookie;headers['X-CSRF-Token']=s.csrfToken;}
 const response=await fetch(base+route,{method,headers,body:bytes??(body===undefined?undefined:JSON.stringify(body))});
 const json=await response.json();if(!response.ok)throw new Error(route+' '+response.status+' '+JSON.stringify(json.error));
 return {data:json.data,cookie:response.headers.get('set-cookie')};
}
const call=async(...args)=>(await api(...args)).data;
async function login(role,email){if(sessions[role])return;const r=await api('/auth/login',{email,password:credentials.password},'NONE');sessions[role]={cookie:r.cookie.split(';')[0],csrfToken:r.data.csrfToken};await fs.writeFile(sessionFile,JSON.stringify(sessions),{mode:0o600});}
async function step(key,work){if(state.records[key])return state.records[key];const value=await work();state.records[key]=value;await fs.writeFile(manifest,JSON.stringify(state,null,2),{mode:0o600});console.log('Persisted demo record:',key);return value;}
const stockCommand=(version)=>({...command(version),reference:'DEMO-'+randomUUID()});
const command=(version)=>({version,idempotencyKey:'DEMO-'+randomUUID(),reason});
await login('ADMIN',credentials.users.ADMIN.email);await login('REVIEW',credentials.users.ADMIN_REVIEW.email);
const users={};for(const [role,name] of Object.entries({ADMIN:'Ananya Rao',SALES:'Kiran Mehta',TECHNICIAN:'Ravi Menon',WAREHOUSE:'Farhan Ali',SUPPORT:'Meera Shah',FINANCE:'Divya Nair'})){
 users[role]=await step('user-'+role,()=>call('/users',{name:name+' (DEMO HelioNest)',email:role.toLowerCase()+'@helionest.example.test',password:credentials.password,role}));
 if(role!=='ADMIN')await login(role,users[role].email);
}
const customers=[],sites=[],leads=[];
for(const [i,name] of ['Aarav Sharma','Lakshmi Iyer','Greenleaf Learning Centre','Bluebird Design Studio'].entries()){
 const customer=await step('customer-'+i,()=>call('/customers',{name:name+' (DEMO)',type:i<2?'INDIVIDUAL':'BUSINESS',phone:'+1202555010'+i,email:'customer'+i+'@helionest.example.test'},'SALES'));
 customers.push(customer);
 sites.push(await step('site-'+i,()=>call('/customers/'+customer.id+'/sites',{name:['Miyapur Family Rooftop','Kondapur Residence','Learning Centre Terrace','Studio Rooftop'][i]+' (DEMO)',addressLine1:(12+i)+' Fictional Solar Lane',city:'Hyderabad',state:'Telangana',postalCode:'500049',country:'IN'},'SALES')));
 let lead=await step('lead-'+i,()=>call('/leads',{customerId:customer.id,siteId:sites[i].id,source:['WEBSITE','REFERRAL','PHONE','WEBSITE'][i],priority:i===2?'HIGH':'MEDIUM',preferredSystemType:'ON_GRID',requestedCapacityKw:'3.200',qualificationNotes:reason},'SALES'));
 for(const status of (i===0?['CONTACTED','QUALIFIED','SURVEY_REQUESTED']:i===1?['CONTACTED','QUALIFIED']:i===2?['CONTACTED']:[]))lead=await step('lead-'+i+'-'+status,()=>call('/leads/'+lead.id+'/status',{version:lead.version,status,reason},'SALES'));
 leads.push(lead);
}
let survey=await step('survey',()=>call('/surveys',{leadId:leads[0].id,siteId:sites[0].id,requestNotes:reason},'SALES'));
survey=await step('survey-assigned',()=>call('/surveys/'+survey.id+'/assign',{version:survey.version,assignedToId:users.TECHNICIAN.id,reason}));
survey=await step('survey-scheduled',()=>call('/surveys/'+survey.id+'/schedule',{version:survey.version,scheduledAt:new Date(Date.now()+2500).toISOString(),expectedDurationMinutes:30,reason}));
// Wait for the actual scheduled instant; do not bypass the backend start window.
if(!state.records['survey-started'])await new Promise(r=>setTimeout(r,Math.max(0,new Date(survey.scheduledAt).getTime()-Date.now()+100)));
survey=await step('survey-started',()=>call('/surveys/'+survey.id+'/start',{version:survey.version,reason},'TECHNICIAN'));
const roof=await step('roof',()=>call('/surveys/'+survey.id+'/roof-assessment',{version:survey.version,roofType:'RCC',roofTypeDetails:null,usableAreaSqm:'42',mountingSpaceSqm:'32',azimuthDegrees:'180',tiltDegrees:'20',shadingLevel:'NONE',shadingObservations:reason,nearbyObstructions:reason,accessibility:'ACCESSIBLE',accessibilityNotes:reason,visibleCondition:'GOOD',conditionNotes:reason,mountingConcerns:reason,structuralNotes:reason,specialistVerificationRequired:false,recommendations:reason},'TECHNICIAN','PUT'));survey.version=roof.surveyVersion;
const electrical=await step('electrical',()=>call('/surveys/'+survey.id+'/electrical-assessment',{version:survey.version,gridConnection:'CONNECTED',supplyPhase:'SINGLE_PHASE',meterDetails:reason,panelPresent:true,panelObservations:reason,approximateCableRunMeters:'15',earthingObservations:reason,inverterPlacementOptions:reason,batteryPlacementConsiderations:null,safetyConcerns:reason,safetyVerificationRequired:false,gridSuitabilityObservations:reason,additionalNotes:reason},'TECHNICIAN','PUT'));survey.version=electrical.surveyVersion;
survey=await step('survey-findings',()=>call('/surveys/'+survey.id,{version:survey.version,recommendedCapacityKw:'3.2',recommendedSystemType:'ON_GRID',suitability:'SUITABLE',technicalAssumptions:reason,feasibilityNotes:reason},'TECHNICIAN','PATCH'));
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9N0AAAAASUVORK5CYII=','base64');
for(const category of ['ROOF_PHOTO','METER_PHOTO','PANEL_PHOTO']){const uploaded=await step('survey-'+category,()=>call('/surveys/'+survey.id+'/attachments?'+new URLSearchParams({version:String(survey.version),category,fileName:'DEMO_SYNTHETIC_'+category+'.png'}),undefined,'TECHNICIAN','POST',image));survey.version=uploaded.surveyVersion;}
survey=await step('survey-submitted',()=>call('/surveys/'+survey.id+'/submit',{version:survey.version,reason},'TECHNICIAN'));
const review=await step('survey-reviewed',()=>call('/surveys/'+survey.id+'/review',{version:survey.version,decision:'APPROVED',notes:reason,checklist:{roofReviewed:true,electricalReviewed:true,evidenceReviewed:true,assumptionsReviewed:true,limitationsAcknowledged:true,conditionalWorkAcknowledged:false}},'REVIEW'));survey=review.survey;
const approved=await call('/surveys/'+survey.id+'/approved');
const components=[];
const catalog=[{sku:'DEMO-HN-P400',name:'HelioNest 400 W Panel (DEMO)',category:'SOLAR_PANEL',unitCost:'7200',serializationRequired:true,specifications:{ratedPowerW:'400',vmpV:'40',vocV:'49',impA:'10',iscA:'10.5'}},{sku:'DEMO-HN-I3200',name:'HelioNest 3.2 kW On-grid Inverter (DEMO)',category:'INVERTER',unitCost:'28500',serializationRequired:true,specifications:{ratedAcPowerKw:'3.2',maxPvPowerW:'4000',mpptInputs:1,maxDcVoltageV:'600',minMpptVoltageV:'150',maxMpptVoltageV:'500',maxInputCurrentPerMpptA:'20',maxIscPerMpptA:'25',supportedSystemTypes:['ON_GRID'],phase:'SINGLE_PHASE',batterylessSupported:true}},{sku:'DEMO-HN-MOUNT',name:'HelioNest RCC Mounting Kit (DEMO)',category:'MOUNTING_STRUCTURE',unitCost:'12500',serializationRequired:false,specifications:{notes:reason}}];
for(const [i,row] of catalog.entries())components.push(await step('component-'+i,()=>call('/solar/components',{...row,unit:'PCS',currency:'INR',manufacturer:'HelioNest Fictional Equipment',modelNumber:row.sku,specificationSource:reason})));
const template=await step('template',()=>call('/solar/templates',{code:'DEMO-HN-3K2',name:'HelioNest Residential On-grid (DEMO)',systemType:'ON_GRID',nominalCapacityKw:'3.2',minimumCapacityKw:'3.2',maximumCapacityKw:'3.2',validationPolicy:{capacityTolerancePercent:'5',minDcAcRatio:'0.9',maxDcAcRatio:'1.2',voltageHeadroomPercent:'5',batteryRequired:false,requiredCategories:['SOLAR_PANEL','INVERTER','MOUNTING_STRUCTURE'],pvInputMode:'INVERTER',basis:reason},components:components.map((c,i)=>({componentId:c.id,defaultQuantity:i===0?'8':'1',unit:c.unit,required:true,position:i}))}));
let design=(await step('configuration',()=>call('/solar/configurations',{name:'Sharma Miyapur 3.2 kW (DEMO)',approvedSurveyId:survey.id,approvedSurveyVersion:approved.approvedVersion,surveyReviewId:approved.reviewId,templateId:template.id,templateVersion:template.version,systemType:'ON_GRID',outputPhase:'SINGLE_PHASE',targetCapacityKw:'3.2',currency:'INR',technicalAssumptions:reason,reason}))).configuration;
design=await step('design-electrical',()=>call('/solar/configurations/'+design.id,{version:design.version,reason,electricalDesign:{arrays:[{panelComponentId:components[0].id,deviceComponentId:components[1].id,deviceUnit:1,mpptInput:1,seriesPanels:8,parallelStrings:1,coldVocPerPanelV:'55',hotVmpPerPanelV:'35',maximumVmpPerPanelV:'45',operatingCurrentPerStringA:'11',shortCircuitCurrentPerStringA:'12',basis:reason}],batteryBank:null}},'ADMIN','PATCH'));
design=await step('design-submit',()=>call('/solar/configurations/'+design.id+'/submit',{version:design.version,reason}));
const designReview=await step('design-review',()=>call('/solar/configurations/'+design.id+'/review',{version:design.version,decision:'APPROVED',notes:reason,checklist:{compatibilityReviewed:true,costingReviewed:true,assumptionsReviewed:true,surveyConditionsAcknowledged:true,designLimitationsAcknowledged:true}},'REVIEW'));design=designReview.configuration;
const designHandoff=await call('/solar/configurations/'+design.id+'/approved');
const warehouse=await step('warehouse',()=>call('/inventory/warehouses',{...stockCommand(),code:'DEMO-HN-HYD',name:'HelioNest Hyderabad Warehouse (DEMO)',address:'24 Fictional Logistics Road, Hyderabad'}));
const selections=[];
for(const [i,component] of components.entries()){
 const quantity=i===0?'16':i===1?'2':'4';
 await step('receipt-'+i,()=>call('/inventory/receipts',{...stockCommand(),warehouseId:warehouse.id,componentId:component.id,quantity,receivedAt:new Date().toISOString(),supplierNotes:reason,serialNumbers:component.serializationRequired?Array.from({length:Number(quantity)},(_,n)=>'DEMO-HN-'+i+'-'+String(n+1).padStart(4,'0')):[]},'WAREHOUSE'));
 if(component.serializationRequired){const serials=await call('/inventory/serials?warehouseId='+warehouse.id+'&componentId='+component.id+'&pageSize=100');selections.push({componentId:component.id,serialIds:serials.filter(s=>s.state==='AVAILABLE').slice(0,i===0?8:1).map(s=>s.id)});}
}
const reservation=(await step('reservation',()=>call('/inventory/reservations',{...stockCommand(),configurationId:design.id,approvedVersion:designHandoff.approvedVersion,reviewId:designHandoff.reviewId,bomId:designHandoff.bom.id,bomVersion:designHandoff.bom.version,warehouseId:warehouse.id,serialSelections:selections},'WAREHOUSE'))).reservation;
const dispatch=(await step('dispatch',()=>call('/inventory/dispatches',{...stockCommand(reservation.version),reservationId:reservation.id,dispatchedAt:new Date().toISOString(),notes:reason+'; warehouse release only, site receipt not confirmed'},'WAREHOUSE'))).dispatch;
const testTypes=['VISUAL_INSPECTION','MOUNTING_VERIFICATION','POLARITY','EARTHING','INSULATION','INVERTER_STARTUP','PROTECTION_DEVICES','BATTERY','FUNCTIONAL_SYSTEM'];
const installation=await step('installation',()=>call('/installations',{name:'Sharma Rooftop Installation (DEMO)',dispatchId:dispatch.id,reservationId:reservation.id,configurationId:design.id,configurationApprovedVersion:designHandoff.approvedVersion,configurationReviewId:designHandoff.reviewId,bomId:designHandoff.bom.id,bomVersion:designHandoff.bom.version,coordinatorId:users.ADMIN.id,technicianIds:[users.TECHNICIAN.id],plannedStartAt:new Date(Date.now()+2*86400000).toISOString(),plannedEndAt:new Date(Date.now()+2*86400000+4*3600000).toISOString(),testRequirements:testTypes.map(type=>({type,required:type!=='BATTERY',basis:reason,measurementRequired:false,unit:null})),reason}));

// Continue through explicit installation execution; every attestation below is DEMO ONLY.
let job=installation;
const uploaded=await step('installation-evidence',()=>call('/installations/'+job.id+'/attachments?'+new URLSearchParams({version:String(job.version),reason,category:'COMPLETION',fileName:'DEMO_SYNTHETIC_NOT_FIELD_EVIDENCE.png'}),undefined,'ADMIN','POST',image));job.version=uploaded.jobVersion;
const evidenceIds=[uploaded.attachment.id];
async function jobStep(key,route,body={},method='POST',role='ADMIN'){
 const result=await step(key,()=>call('/installations/'+job.id+route,{version:job.version,reason,...body},role,method));job=result.job??result;return result;
}
await jobStep('readiness','/site-readiness',{checklist:{siteAccessConfirmed:true,installationAreaAccessible:true,roofSiteConditionChecked:true,safetyMeasuresAvailable:true,surveyLimitationsReviewed:true,conditionalWorkAddressed:true},notes:reason,conditionalWorkResolution:reason,outstandingIssues:null,evidenceIds});
const equipment=(await call('/installations/'+job.id)).equipment;
await jobStep('physical-receipt','/confirm-receipt',{receivedAt:new Date().toISOString(),notes:reason,evidenceIds,lines:equipment.map(e=>({equipmentId:e.id,receivedQuantity:e.dispatchedQuantity,damagedQuantity:'0',receivedSerialIds:e.serials.map(s=>s.serialUnitId),damagedSerialIds:[]}))});
await jobStep('installation-start','/start');
for(const e of equipment)await jobStep('installed-'+e.id,'/equipment/install',{equipmentId:e.id,installedQuantity:e.dispatchedQuantity,installedSerialIds:e.serials.map(s=>s.serialUnitId),installedLocation:'DEMO '+(e.component?.name??e.componentId),notes:reason,evidenceIds});
for(const milestone of await call('/installations/'+job.id+'/milestones'))await jobStep('milestone-'+milestone.id,'/milestones/'+milestone.id,{status:milestone.required?'COMPLETED':'NOT_APPLICABLE',responsibleUserId:users.TECHNICIAN.id,plannedStartAt:null,plannedEndAt:null,checks:{approvedDesignFollowed:true,safetyChecked:true,evidenceReviewed:true},completionNotes:reason,evidenceIds},'PUT');
await jobStep('completion-notes','',{completionNotes:reason},'PATCH');await jobStep('work-completed','/submit-completion');await jobStep('testing','/begin-testing');
for(const type of testTypes.filter(t=>t!=='BATTERY'))await jobStep('test-'+type,'/tests',{type,applicable:true,result:'PASS',observations:reason,measurement:null,unit:null,requirementsBasis:reason,notApplicableReason:null,notes:'Fictional software demonstration only; no field measurement or certification',evidenceIds});
await jobStep('commissioning-submit','/submit-commissioning');
await jobStep('commissioning-review','/review',{decision:'APPROVED',notes:reason,checklist:{siteReceiptVerified:true,milestonesReviewed:true,equipmentReconciled:true,testsReviewed:true,conditionsAddressed:true,evidenceReviewed:true,internalScopeAcknowledged:true}},'POST','REVIEW');
await step('warranty-access',()=>call('/warranties/installations/'+job.id+'/access',{userId:users.SUPPORT.id,...command()}));
await step('service-access',()=>call('/service/installations/'+job.id+'/access',{userId:users.SUPPORT.id,...command(null)}));
for(const c of customers)await step('finance-access-'+c.id,()=>call('/finance/customers/'+c.id+'/access',{userId:users.FINANCE.id,...command(null)}));
const profile=await step('technician-profile',()=>call('/technicians/'+users.TECHNICIAN.id+'/profile',{employeeCode:'DEMO-HN-TECH-001',contactPhone:null,emergencyContact:null,baseLocation:'Hyderabad (DEMO)',employmentStatus:'ACTIVE',joinedAt:new Date(Date.now()-365*86400000).toISOString(),experienceMonths:36,specializations:['Residential rooftop PV (fictional scenario)'],maxActiveAssignments:4,minimumRestMinutes:660,enforceScheduling:false,isActive:true,privateNotes:reason,reason}));
const skill=await step('skill-catalog',()=>call('/technicians/skills/catalog',{code:'DEMO-HN-PV',name:'Residential PV installation (DEMO)',description:reason,mandatoryFor:[],minimumLevel:2,requiresCertification:false,reason}));
const qualified=await step('technician-skill',()=>call('/technicians/'+users.TECHNICIAN.id+'/skills',{version:profile.version,reason,skillId:skill.id,level:3,experienceMonths:36,verification:'DECLARED',evidenceReference:null}));
await step('technician-certificate',()=>call('/technicians/'+users.TECHNICIAN.id+'/certifications',{version:qualified.profileVersion,reason,skillId:skill.id,provider:'Fictional HelioNest Training Academy (DEMO)',certificateNumber:'DEMO-NOT-A-REAL-CERTIFICATE',issuedAt:new Date(Date.now()-180*86400000).toISOString(),expiresAt:new Date(Date.now()+185*86400000).toISOString(),evidenceReference:'DEMO ONLY; not independently verified or valid for safety qualification',verification:'DECLARED'}));
const policy=await step('warranty-policy',()=>call('/warranties/policies',{...command(),reference:'DEMO-HN-WORK',name:'HelioNest Workmanship (DEMO)',coverageType:'INSTALLER_WORKMANSHIP',providerType:'INSTALLER',providerName:'HelioNest Solar Solutions (fictional)',applicableComponentId:null,applicableCategory:null,duration:12,durationUnit:'MONTHS',startRule:'MANUAL_VERIFIED_DATE',coverageDescription:reason,exclusions:'DEMO ONLY policy; no real coverage',claimConditions:reason,requiredDocuments:[],claimRequiredDocuments:[],requiresProviderRegistration:false,registrationDeadlineDays:null,effectiveFrom:new Date().toISOString().slice(0,10),effectiveTo:null,backdatingReason:null}));
const policyId=policy.id??policy.policy?.id;
await step('warranty-registration',()=>call('/warranties/registrations',{...command(),installationId:job.id,policyId,policyVersion:1,equipmentId:null,serialUnitId:null}));
await step('service-ticket',()=>call('/service/tickets',{...command(),installationId:job.id,equipmentId:null,serialUnitId:null,warrantyClaimId:null,reportedIssue:'DEMO: Customer requests first maintenance visit',description:reason,category:'PREVENTIVE_MAINTENANCE',priority:'MEDIUM',channel:'DEMO customer phone scenario',slaPolicyId:null},'SUPPORT'));
const book=await step('price-book',()=>call('/finance/price-books',{...command(),reference:'DEMO-HN-RETAIL',revision:1,name:'HelioNest Residential INR Prices (DEMO)',currency:'INR',effectiveFrom:new Date(Date.now()-60000).toISOString(),effectiveTo:null,discountApprovalPercent:'5',approvalThresholdAmount:'500000',lines:components.map((c,i)=>({code:c.sku,kind:'COMPONENT',componentId:c.id,description:c.name,unit:'PCS',unitPrice:['9500','38500','17000'][i],estimatedUnitCost:catalog[i].unitCost,costSourceNotes:reason}))}));
const tax=await step('tax-rule',()=>call('/finance/tax-rules',{...command(),reference:'DEMO-HN-TAX',revision:1,name:'Fictional 5 percent demonstration rule',currency:'INR',ratePercent:'5',inclusive:false,jurisdictionNotes:'DEMO ONLY: illustrative rate; not tax advice or a validated Indian tax classification',effectiveFrom:new Date(Date.now()-60000).toISOString(),effectiveTo:null}));
const bookFull=await call('/finance/price-books/'+book.id);
await step('quotation',()=>call('/finance/quotations',{...command(),kind:'INSTALLATION',configurationId:design.id,serviceChargeId:null,priceBookId:book.id,validUntil:new Date(Date.now()+30*86400000).toISOString(),terms:reason,lines:bookFull.lines.map(l=>({priceBookLineId:l.id,taxRuleId:tax.id,quantity:l.componentId===components[0].id?'8':'1',discount:'0'}))},'SALES'));
await step('payment',()=>call('/finance/payments',{...command(),customerId:customers[0].id,currency:'INR',amount:'25000',method:'BANK_TRANSFER',externalReference:'DEMO-NOT-A-REAL-BANK-RECEIPT',paidAt:new Date().toISOString(),notes:reason},'FINANCE'));
await step('expense',()=>call('/finance/expenses',{...command(),installationId:job.id,serviceTicketId:null,category:'TRANSPORT',description:'DEMO warehouse-to-site transport cost',vendorOrPayee:'Fictional GreenRoute Logistics',amount:'1800',currency:'INR',incurredAt:new Date().toISOString(),costBasis:'NET_ACTUAL_COST'},'FINANCE'));
state.completedAt=new Date().toISOString();await fs.writeFile(manifest,JSON.stringify(state,null,2),{mode:0o600});
console.log('Fictional company provisioned via live APIs. Warranty remains pending date/evidence; receipt is unverified and quotation/expense remain drafts.');
