import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pea-cream">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <span className="text-6xl font-serif font-bold text-pea-blue/20">404</span>
        <h2 className="text-2xl font-serif font-semibold text-pea-blue">
          Page introuvable
        </h2>
        <p className="text-sm text-pea-gray leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-pea-blue text-white hover:bg-pea-teal transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
