// Application root uses database-backed cookie sessions.
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { realAuthService } from '../features/auth/services/realAuthService';
import { router } from './router';
import {ApiErrorBanner} from '../components/common/ApiErrorBanner';

export function App() {
  return (
    <AuthProvider service={realAuthService}>
      <ApiErrorBanner />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

