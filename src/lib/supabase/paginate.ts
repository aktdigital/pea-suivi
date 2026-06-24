/**
 * Récupère TOUTES les lignes d'une requête PostgREST en paginant via `.range()`,
 * pour contourner le plafond « Max rows » (1000 par défaut) de Supabase/PostgREST.
 *
 * La requête est reconstruite à chaque page (un builder PostgREST n'est exécutable
 * qu'une fois). Appliquer les filtres AVANT le `.range(from, to)` final.
 *
 * @param buildPage - fabrique la requête pour la plage [from, to]
 * @param pageSize  - taille de page (défaut 1000, = plafond Supabase)
 */
export async function fetchAllRows<T>(
  buildPage: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildPage(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    all.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
