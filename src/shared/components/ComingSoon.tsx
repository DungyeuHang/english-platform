interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <section className="rounded-card border border-line bg-surface p-8 shadow-card">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">Coming soon</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">{title}</h1>
      <p className="mt-2 text-ink-soft">
        This module is part of the roadmap and will be implemented in a later phase.
      </p>
    </section>
  );
}