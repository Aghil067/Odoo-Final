/**
 * LoginPage.tsx
 * ─────────────────────────────────────────────────────────────
 * Authentication login page.
 *
 * FEATURES:
 *  - Email + password form with client-side validation
 *  - Show/hide password toggle
 *  - Remember me checkbox (passed to auth service)
 *  - Loading state while the login request is in flight
 *  - Error message display on invalid credentials
 *  - Redirect to intended destination after login (or /dashboard)
 *  - DEV ONLY: Quick-select panel for mock role accounts
 *    (hidden in production builds via import.meta.env.PROD)
 *
 * DESIGN:
 *  Professional solar-energy theme.
 *  White card, green + dark navy accents.
 *  Subtle solar panel grid background.
 */

import { Eye, EyeOff, Loader2, Sun, Zap } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_ACCOUNT_LIST } from '../services/mockAuthService';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/auth.types';
import { ROLE_META } from '../../../config/roles';

// ─── Form state type ────────────────────────────────────────────
interface FormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

// ─── Form validation ────────────────────────────────────────────
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }
  return errors;
}

// ─── Role colour helper ─────────────────────────────────────────
function getRoleColour(role: UserRole): string {
  return ROLE_META[role]?.badgeColour ?? 'bg-slate-100 text-slate-800';
}

// ─── Component ──────────────────────────────────────────────────
export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // After login, redirect to the originally intended page (or dashboard)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const [values, setValues] = useState<FormValues>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});

  // ── Handlers ─────────────────────────────────────────────────
  function handleChange(field: keyof FormValues, value: string | boolean) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const newErrors = validate({ ...values, [field]: value });
      setErrors(newErrors);
    }
  }

  function handleBlur(field: keyof FormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const newErrors = validate(values);
    setErrors(newErrors);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await login({ email: values.email, password: values.password, rememberMe: values.rememberMe });
      navigate(from, { replace: true });
    } catch {
      // Error is already captured in AuthContext and displayed below
    }
  }

  // Dev panel: fill in credentials for a mock account
  function selectMockAccount(email: string, password: string) {
    setValues((prev) => ({ ...prev, email, password }));
    setErrors({});
    setTouched({});
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel – decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Solar panel grid background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #22c55e 39px, #22c55e 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, #22c55e 39px, #22c55e 40px)`,
          }}
        />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <Zap className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Solar Installation<br />Management System
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            End-to-end management for solar installation businesses.
            From customer acquisition to warranty service.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: Sun, label: 'Site Surveys' },
              { icon: Zap, label: 'Installations' },
              { icon: Sun, label: 'Service & Warranty' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-slate-800/60 rounded-xl p-4 text-center">
                <Icon className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-slate-300 text-xs font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">SolarMS</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 mt-1 text-sm">Sign in to your account to continue.</p>
            </div>

            {/* Server / auth error */}
            {error && (
              <div
                role="alert"
                className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  disabled={isLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`
                    w-full px-4 py-2.5 rounded-lg border text-sm text-slate-800
                    bg-white placeholder-slate-400
                    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                    disabled:bg-slate-50 disabled:cursor-not-allowed
                    transition-colors
                    ${errors.email ? 'border-red-400' : 'border-slate-300'}
                  `}
                  placeholder="you@solar-demo.com"
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`
                      w-full px-4 py-2.5 pr-10 rounded-lg border text-sm text-slate-800
                      bg-white placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
                      disabled:bg-slate-50 disabled:cursor-not-allowed
                      transition-colors
                      ${errors.password ? 'border-red-400' : 'border-slate-300'}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                               hover:text-slate-600 focus:outline-none focus:ring-2
                               focus:ring-green-500 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-slate-300 text-green-600
                             focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full flex items-center justify-center gap-2
                  bg-green-600 hover:bg-green-700 active:bg-green-800
                  text-white font-semibold py-2.5 px-4 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors duration-150
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* ─── DEV-ONLY: Quick credential selector ─────────────────
               Rendered only in development builds.
               import.meta.env.PROD is true in `npm run build` → hidden. */}
          {!import.meta.env.PROD && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  🛠 Dev Mode — Test Accounts
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Password for all accounts:{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">{MOCK_ACCOUNT_LIST[0]?.password}</code>
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {MOCK_ACCOUNT_LIST.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => selectMockAccount(account.email, account.password)}
                    className="flex flex-col items-start p-2 rounded-lg bg-white border border-amber-200
                               hover:border-amber-400 hover:bg-amber-50 transition-colors text-left
                               focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full mb-1 ${getRoleColour(account.role as UserRole)}`}>
                      {ROLE_META[account.role as UserRole]?.label}
                    </span>
                    <span className="text-xs text-slate-600 truncate w-full">{account.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

