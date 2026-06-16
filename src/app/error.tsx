"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pea-cream">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <h2 className="text-2xl font-serif font-semibold text-pea-blue">
          Une erreur est survenue
        </h2>
        <p className="text-sm text-pea-gray leading-relaxed">
          Une erreur inattendue s&apos;est produite. Veuillez réessayer ou contacter votre administrateur si le problème persiste.
        </p>
        {error?.digest && (
          <p className="text-xs text-muted-foreground font-mono">Réf. : {error.digest}</p>
        )}
        <button
          onClick={() => unstable_retry()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 bg-pea-blue text-white hover:bg-pea-teal transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
