/**
 * NotFoundPage.tsx
 * ─────────────────────────────────────────────────────────────
 * 404 Not Found page – shown when no route matches the URL.
 */

import { SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-7xl font-black text-slate-200 mb-2">404</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg
                     hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                     transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

