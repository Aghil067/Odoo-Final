import {useState,type FormEvent} from 'react';
import {Card} from '../../../components/ui/Card';
import {Input} from '../../../components/ui/Input';
import {Select} from '../../../components/ui/Select';
import {Textarea} from '../../../components/ui/Textarea';
import {Button} from '../../../components/ui/Button';
interface Field {key:string;label:string;options?:string[];decimal?:boolean;optional?:boolean;boolean?:boolean}
export const roofFields:Field[]=[
 {key:'roofType',label:'Roof Construction',options:['RCC','METAL','TILE','OTHER']},{key:'roofTypeDetails',label:'Other Roof Construction Details',optional:true},
 {key:'usableAreaSqm',label:'Usable Area (m2)',decimal:true},{key:'mountingSpaceSqm',label:'Mounting Space (m2)',decimal:true},
 {key:'azimuthDegrees',label:'Azimuth (degrees)',decimal:true},{key:'tiltDegrees',label:'Tilt (degrees)',decimal:true},
 {key:'shadingLevel',label:'Shading Level',options:['NONE','LOW','MODERATE','HIGH']},{key:'shadingObservations',label:'Shading Observations'},{key:'nearbyObstructions',label:'Nearby Obstructions'},
 {key:'accessibility',label:'Roof Accessibility',options:['ACCESSIBLE','RESTRICTED','UNSAFE','UNKNOWN']},{key:'accessibilityNotes',label:'Access Notes'},
 {key:'visibleCondition',label:'Visible Roof Condition',options:['GOOD','FAIR','POOR','UNKNOWN']},{key:'conditionNotes',label:'Roof Condition Notes'},
 {key:'mountingConcerns',label:'Mounting Concerns'},{key:'structuralNotes',label:'Structural Observations'},
 {key:'specialistVerificationRequired',label:'Specialist Verification Required',boolean:true},{key:'recommendations',label:'Roof Recommendations'}
];
export const electricalFields:Field[]=[
 {key:'gridConnection',label:'Grid Connection',options:['CONNECTED','NOT_CONNECTED','UNKNOWN']},{key:'supplyPhase',label:'Supply Phase',options:['SINGLE_PHASE','THREE_PHASE','UNKNOWN']},
 {key:'meterDetails',label:'Meter Details',optional:true},{key:'panelPresent',label:'Distribution Panel Present',boolean:true},{key:'panelObservations',label:'Distribution Panel Observations'},
 {key:'approximateCableRunMeters',label:'Approximate Cable Run (m)',decimal:true,optional:true},{key:'earthingObservations',label:'Earthing Observations'},
 {key:'inverterPlacementOptions',label:'Inverter Placement Options'},{key:'batteryPlacementConsiderations',label:'Battery Placement Considerations',optional:true},
 {key:'safetyConcerns',label:'Electrical Safety Concerns'},{key:'safetyVerificationRequired',label:'Electrical Safety Verification Required',boolean:true},
 {key:'gridSuitabilityObservations',label:'Grid Suitability Observations'},{key:'additionalNotes',label:'Additional Electrical Notes'}
];
export const feasibilityFields:Field[]=[
 {key:'recommendedCapacityKw',label:'Recommended Capacity (kW)',decimal:true,optional:true},{key:'recommendedSystemType',label:'Recommended System Type',options:['ON_GRID','OFF_GRID','UNDECIDED']},
 {key:'suitability',label:'Site Suitability',options:['UNASSESSED','SUITABLE','CONDITIONALLY_SUITABLE','NOT_SUITABLE']},
 {key:'infeasibilityReason',label:'Infeasibility Reason',optional:true},{key:'additionalWorkRequired',label:'Conditional Work Required',optional:true},
 {key:'technicalAssumptions',label:'Technical Assumptions',optional:true},{key:'feasibilityNotes',label:'Feasibility Notes',optional:true}
];
export function AssessmentFields({title,fields,initial,onSave,readOnly=false}:{title:string;fields:Field[];initial:Record<string,unknown>;onSave?:(value:Record<string,unknown>)=>Promise<void>;readOnly?:boolean}){
 const [value,setValue]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.key,initial[f.key]===null||initial[f.key]===undefined?'':String(initial[f.key])]))),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();if(!onSave)return;setBusy(true);setError('');setSaved(false);try{await onSave(Object.fromEntries(fields.map(f=>[f.key,f.boolean?value[f.key]==='true':f.optional&&!value[f.key]?.trim()?null:value[f.key]])));setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Could not save findings');}finally{setBusy(false);}}
 const content=<><h2 className="font-semibold mb-4">{title}</h2><div className="grid sm:grid-cols-2 gap-4">{fields.map(f=><div key={f.key}>{readOnly?<><span className="text-xs text-slate-500">{f.label}</span><p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{initial[f.key]===null||initial[f.key]===undefined?'Not recorded':String(initial[f.key])}</p></>:f.options||f.boolean?<Select label={f.label} required={!f.optional} placeholder="Choose an observed value" value={value[f.key]} onChange={e=>setValue({...value,[f.key]:e.target.value})} options={(f.boolean?['true','false']:f.options!).map(v=>({value:v,label:v==='true'?'Yes':v==='false'?'No':v.replaceAll('_',' ')}))}/>:f.decimal?<Input label={f.label} required={!f.optional} inputMode="decimal" pattern="(0|[1-9][0-9]*)(\.[0-9]{1,3})?" value={value[f.key]} onChange={e=>setValue({...value,[f.key]:e.target.value})}/>:<Textarea label={f.label} required={!f.optional} maxLength={f.key==='accessibilityNotes'||f.key==='roofTypeDetails'||f.key==='meterDetails'||f.key==='infeasibilityReason'?2000:5000} value={value[f.key]} onChange={e=>setValue({...value,[f.key]:e.target.value})}/>}</div>)}</div>{error&&<p role="alert" className="text-red-700 mt-3">{error}</p>}{saved&&<p role="status" className="text-green-700 mt-3">Saved to the database.</p>}{!readOnly&&<Button type="submit" isLoading={busy} className="mt-4">Save {title}</Button>}</>;
 return <Card>{readOnly?content:<form onSubmit={submit}>{content}</form>}</Card>;
}
