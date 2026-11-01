import {useEffect,useState} from 'react';
import {useParams,Link} from 'react-router-dom';
import {useAuth} from '../../auth/hooks/useAuth';
import {surveyService,type SurveyRecord} from '../services/surveyService';
import {AssessmentFields,roofFields,electricalFields,feasibilityFields} from '../components/AssessmentFields';
export function SurveyExecutionPage(){
 const {id}=useParams(),{user}=useAuth();const [survey,setSurvey]=useState<SurveyRecord|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 async function load(){if(!id)return;setSurvey(await surveyService.getRecord(id));}
 useEffect(()=>{load().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[id]);
 if(loading)return <p role="status">Loading inspection...</p>;if(error)return <p role="alert" className="text-red-700">{error}</p>;if(!survey)return <p>Survey not found.</p>;
 const editable=user?.role==='technician'&&survey.assignedToId===user.id&&['IN_PROGRESS','REVISION_REQUIRED'].includes(survey.status);
 return <div className="space-y-6 max-w-5xl mx-auto"><div><Link className="text-green-700 text-sm" to={`/surveys/${id}`}>Back to survey</Link><h1 className="text-2xl font-bold text-slate-800">Record Site Inspection Findings</h1><p className="text-sm text-slate-500">{survey.reference} / {survey.customer?.name} / {survey.site?.name}</p></div>{!editable&&<p className="text-amber-800">Only the assigned technician may edit findings during an active visit or revision.</p>}<AssessmentFields key={`roof-${survey.id}`} title="Roof Findings" fields={roofFields} initial={survey.roofAssessment??{}} readOnly={!editable} onSave={async data=>{await surveyService.assessment(survey.id,'roof',survey.version,data);await load();}}/><AssessmentFields key={`electrical-${survey.id}`} title="Electrical Findings" fields={electricalFields} initial={survey.electricalAssessment??{}} readOnly={!editable} onSave={async data=>{await surveyService.assessment(survey.id,'electrical',survey.version,data);await load();}}/><AssessmentFields key={`feasibility-${survey.id}`} title="Feasibility Assessment" fields={feasibilityFields} initial={{...survey}} readOnly={!editable} onSave={async data=>{await surveyService.feasibility(survey.id,survey.version,data);await load();}}/><p className="text-xs text-slate-500">These observations support internal feasibility review. They do not certify electrical or structural safety. Record actual observations and measurements.</p></div>;
}
