import {ApiError,getData,postData,setCsrfToken} from '../../../services/apiClient';
import type {IAuthService} from './authService';
import type {AuthenticatedUser,UserRole} from '../types/auth.types';
type BackendRole='ADMIN'|'SALES'|'TECHNICIAN'|'WAREHOUSE'|'FINANCE'|'SUPPORT';
type Session={user:{id:string;name:string;email:string;role:BackendRole};csrfToken:string};
const roles:Record<BackendRole,UserRole>={ADMIN:'admin',SALES:'sales_executive',TECHNICIAN:'technician',WAREHOUSE:'inventory_manager',FINANCE:'finance_officer',SUPPORT:'service_manager'};
function accept(session:Session){const role=roles[session.user.role];if(!role)throw new ApiError('The server returned an unsupported role.',403,'UNSUPPORTED_ROLE');setCsrfToken(session.csrfToken);const user:AuthenticatedUser={...session.user,role};return {user};}
export const realAuthService:IAuthService={
  async login({email,password}){return accept(await postData<Session>('/auth/login',{email,password}));},
  async getMe(){try{return accept(await getData<Session>('/auth/me'));}catch(e){if(e instanceof ApiError&&e.status===401){setCsrfToken(null);return null;}throw e;}},
  async logout(){await postData('/auth/logout',{});setCsrfToken(null);}
};
