export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-ink-soft">{text}</p>
      </div>
    </div>
  );
}