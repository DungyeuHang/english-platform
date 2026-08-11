import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function LoginPage() {
  const { login, error, clearError, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setLocalError(error || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = status === 'loading' || isSubmitting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="rounded-card border border-line bg-surface p-8 shadow-card">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-ink">Welcome back</h1>
            <p className="mt-2 text-ink-soft">Sign in to your English Platform account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {(error || localError) && (
              <div className="rounded-card border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
                {localError || error}
              </div>
            )}

            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-soft">
            Don't have an account?{' '}
            <Link to="/auth/register" className="font-medium text-brand-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}