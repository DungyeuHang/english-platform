import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 text-ink-soft">The page you are looking for does not exist.</p>
      <Link to="/" className="mt-4 inline-block font-medium text-brand-600 hover:underline">
        Back to home
      </Link>
    </section>
  );
}