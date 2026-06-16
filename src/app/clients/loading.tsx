export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="pb-4 border-b border-pea-gray/30">
        <div className="h-8 w-40 bg-pea-blue/10 rounded animate-pulse" />
        <div className="h-4 w-56 bg-pea-gray/10 rounded animate-pulse mt-2" />
      </div>
      <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex gap-4 px-4 py-3 border-b border-pea-gray/10 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
            <div className="h-4 w-32 bg-pea-gray/10 rounded animate-pulse" />
            <div className="h-4 w-24 bg-pea-gray/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-pea-gray/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
