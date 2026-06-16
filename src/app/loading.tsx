export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pea-cream">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 rounded-full border-4 border-pea-teal border-t-transparent animate-spin" />
        <p className="text-sm text-pea-gray font-medium">Chargement…</p>
      </div>
    </div>
  );
}
