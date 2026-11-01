import { Construction } from 'lucide-react';
import type { ModuleKey } from '../auth/types/auth.types';

interface PlaceholderPageProps {
  moduleName: string;
  moduleKey: ModuleKey;
}

export function PlaceholderPage({ moduleName, moduleKey }: PlaceholderPageProps) {


  return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center p-8">
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{moduleName}</h2>
      <p className="text-slate-500 max-w-sm mb-4">
        {moduleKey==='user_management'?'Interactive user management is unavailable. No user accounts or role changes can be saved from this screen.':'This workflow is unavailable. No business records or status changes can be saved from this screen.'}
      </p>

    </div>
  );
}

