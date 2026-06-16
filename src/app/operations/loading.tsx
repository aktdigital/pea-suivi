export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-44 bg-pea-blue/10 rounded animate-pulse" />
      <div className="rounded-lg border border-pea-gray/20 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className={`flex gap-4 px-3 py-2.5 border-b border-pea-gray/10 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
            <div className="h-4 w-20 bg-pea-gray/10 rounded animate-pulse" />
            <div className="h-4 w-28 bg-pea-gray/10 rounded animate-pulse" />
            <div className="h-4 w-24 bg-pea-gray/10 rounded animate-pulse" />
            <div className="h-4 w-16 bg-pea-gray/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
