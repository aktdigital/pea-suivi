import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination compacte des tableaux (rendue côté serveur, navigation par liens).
 * `buildHref(page)` doit préserver les filtres actifs dans l'URL.
 */
export function TablePagination({
  page,
  totalPages,
  total,
  from,
  to,
  buildHref,
}: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
      <span>
        {from}–{to} sur {total} · Page {page} / {totalPages}
      </span>
      <div className="flex items-center gap-2">
        {page > 1 && (
          <Link
            href={buildHref(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pea-gray/30 hover:bg-pea-teal/10 hover:text-pea-blue transition-colors text-xs font-medium"
          >
            <ChevronLeft className="size-3" /> Précédent
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={buildHref(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-pea-gray/30 hover:bg-pea-teal/10 hover:text-pea-blue transition-colors text-xs font-medium"
          >
            Suivant <ChevronRight className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
