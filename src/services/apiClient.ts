import axios, {AxiosError,AxiosHeaders,type AxiosRequestConfig} from 'axios';

export class ApiError extends Error {
  readonly status:number;readonly code:string;readonly details?:{field:string;message:string}[];readonly requestId?:string;
  constructor(message:string,status:number,code:string,details?:{field:string;message:string}[],requestId?:string){super(message);this.name='ApiError';this.status=status;this.code=code;this.details=details;this.requestId=requestId;}
}
declare module 'axios' { interface AxiosRequestConfig { _retriedRead?:boolean } }
let csrfToken:string|null=null;
export function setCsrfToken(token:string|null){csrfToken=token;}
export const SESSION_EXPIRED='solar-session-expired';
export const API_FAILURE='solar-api-failure';
export const apiClient=axios.create({baseURL:import.meta.env.VITE_API_BASE_URL??'/api',withCredentials:true,timeout:25000});
apiClient.interceptors.request.use(config=>{
  config.headers=AxiosHeaders.from(config.headers);
  const write=!['get','head','options'].includes(config.method??'get');
  if(write&&csrfToken)config.headers.set('X-CSRF-Token',csrfToken);
  if(config.data instanceof FormData)config.headers.delete('Content-Type');
  else if(write&&!(config.data instanceof Blob)&&!(config.data instanceof ArrayBuffer))config.headers.set('Content-Type','application/json');
  return config;
});
apiClient.interceptors.response.use(response=>response,async(error:AxiosError<{error?:{message?:string;code?:string;details?:{field:string;message:string}[];requestId?:string}}>)=>{
  if(axios.isCancel(error))throw error;
  const status=error.response?.status??0,config=error.config;
  // Mutations and uncertain uploads are never retried. A transient GET may retry once.
  if(config&&config.method==='get'&&!config.signal?.aborted&&(status===0||[502,503,504].includes(status))&&!config._retriedRead){
    config._retriedRead=true;return apiClient.request(config);
  }
  if(status===401&&!config?.url?.match(/\/auth\/(login|me)$/)){
    setCsrfToken(null);if(typeof window!=='undefined')window.dispatchEvent(new Event(SESSION_EXPIRED));
  }
  const body=error.response?.data?.error;
  const failure=new ApiError(body?.message??(status===0?'Cannot connect to the API. Check the connection and try again.':`The server returned HTTP ${status}.`),status,body?.code??(status===0?'NETWORK_ERROR':'HTTP_ERROR'),body?.details,body?.requestId);
  if(typeof window!=='undefined'&&!(status===401&&config?.url==='/auth/me'))window.dispatchEvent(new CustomEvent(API_FAILURE,{detail:failure.message+(failure.details?.map(d=>` ${d.field}: ${d.message}`).join('')??'')}));
  throw failure;
});
export interface Envelope<T>{data:T;pagination?:{page:number;pageSize:number;totalItems:number;totalPages:number};warnings?:unknown[]}
export async function getData<T>(url:string,config?:AxiosRequestConfig){return (await apiClient.get<Envelope<T>>(url,config)).data.data;}
export async function getPage<T>(url:string,params:Record<string,unknown>={}){const result=(await apiClient.get<Envelope<T[]>>(url,{params})).data;if(!result.pagination)throw new ApiError('The server omitted pagination.',502,'INVALID_RESPONSE');return {...result,total:result.pagination.totalItems};}
export async function postData<T>(url:string,body:unknown){return (await apiClient.post<Envelope<T>>(url,body)).data.data;}
export async function patchData<T>(url:string,body:unknown){return (await apiClient.patch<Envelope<T>>(url,body)).data.data;}
export function command(version:number,reason:string,key=crypto.randomUUID()){return {version,reason,idempotencyKey:key};}
export function unsupported(action:string):never{throw new ApiError(`${action} is unavailable in the current backend workflow. No changes were saved.`,422,'UNSUPPORTED_WORKFLOW');}
export async function uploadEvidence<T>(url:string,file:File,params:Record<string,string|number>){return (await apiClient.post<Envelope<T>>(url,file,{params,headers:{'Content-Type':file.type},timeout:60000})).data.data;}
