import { isFirebaseReady } from '@/shared/lib/firebase';

export function HomePage() {
  const firebaseReady = isFirebaseReady();

  return (
    <section className="space-y-6">
      <div className="rounded-card border border-line bg-surface p-8 shadow-card">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Foundation</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">English Learning Platform</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          React + TypeScript + Vite + Tailwind CSS + Firebase. The application foundation is up and
          running.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-ink-soft">
          <span
            className={firebaseReady ? 'h-2 w-2 rounded-full bg-success' : 'h-2 w-2 rounded-full bg-gold-500'}
          />
          {firebaseReady ? 'Firebase configured' : 'Firebase not configured (add .env.local)'}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <InfoCard title="Routing" text="React Router with a feature-based route map under src/app." />
        <InfoCard title="Design system" text="Design tokens in shared/styles drive the visual language." />
        <InfoCard title="Firebase abstraction" text="Services are behind shared/lib/firebase so UI stays decoupled." />
      </div>
    </section>
  );
}

interface InfoCardProps {
  title: string;
  text: string;
}

function InfoCard({ title, text }: InfoCardProps) {
  return (
    <article className="rounded-card border border-line bg-surface p-6 shadow-card">
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{text}</p>
    </article>
  );
}