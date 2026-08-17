"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Settings2 } from "lucide-react";

export interface ToggleColumn {
  key: string;
  label: string;
}

// ── Persistance des colonnes masquées (localStorage) via useSyncExternalStore ──
// Serveur : "[]" (tout visible) ; client : la valeur enregistrée, sans mismatch d'hydratation.
const listeners = new Set<() => void>();
function subscribeStore(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readStore(key: string): string {
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}
function writeStore(key: string, value: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage indisponible */
  }
  listeners.forEach((cb) => cb());
}

/**
 * Enveloppe commune des grands tableaux :
 * - menu « Colonnes » (masquer/afficher, mémorisé par navigateur via localStorage) ;
 * - barre de défilement horizontale DUPLIQUÉE EN HAUT, synchronisée avec celle du bas,
 *   et toujours visible (classe .pea-scrollbar) — indispensable à la souris sans trackpad.
 * Les cellules à masquer portent un attribut data-col="<key>" ; le masquage est fait
 * en CSS pur, ce qui permet de garder le tableau rendu côté serveur.
 */
export function DataTableShell({
  storageKey,
  columns,
  children,
}: {
  /** Clé localStorage propre à chaque tableau (ex. "pea-cols-operations") */
  storageKey: string;
  /** Colonnes masquables (les colonnes essentielles ne sont pas listées) */
  columns: ToggleColumn[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [needsScroll, setNeedsScroll] = useState(false);

  // Colonnes masquées : lues depuis localStorage (côté serveur = tout visible)
  const rawHidden = useSyncExternalStore(
    subscribeStore,
    () => readStore(storageKey),
    () => "[]"
  );
  const hidden = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(rawHidden);
      return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
    } catch {
      return [];
    }
  }, [rawHidden]);

  function toggleCol(key: string) {
    writeStore(storageKey, hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key]);
  }

  // Mesure la largeur défilable pour dimensionner la barre du haut
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      setScrollWidth(el.scrollWidth);
      setNeedsScroll(el.scrollWidth > el.clientWidth + 1);
    };
    const raf = requestAnimationFrame(measure); // après peinture (pas de setState synchrone)
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const t = setTimeout(measure, 80); // filet (fonts, etc.)
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      clearTimeout(t);
    };
  }, [hidden, children]);

  function syncFromMain() {
    if (syncing.current) return;
    syncing.current = true;
    if (topRef.current && scrollRef.current) topRef.current.scrollLeft = scrollRef.current.scrollLeft;
    syncing.current = false;
  }
  function syncFromTop() {
    if (syncing.current) return;
    syncing.current = true;
    if (topRef.current && scrollRef.current) scrollRef.current.scrollLeft = topRef.current.scrollLeft;
    syncing.current = false;
  }

  const hideCls = hidden.map((k) => `hide-col-${k}`).join(" ");

  return (
    <div className="space-y-1">
      {/* Règles de masquage générées pour les colonnes de CE tableau */}
      <style>{columns.map((c) => `.hide-col-${c.key} [data-col="${c.key}"]{display:none;}`).join("\n")}</style>

      {/* Barre d'outils : menu Colonnes */}
      <div className="flex justify-end relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-pea-gray/30 bg-white text-xs font-medium text-pea-blue hover:bg-pea-teal/10 transition-colors"
        >
          <Settings2 className="size-3.5" />
          Colonnes
          {hidden.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-pea-teal/15 text-pea-teal text-[10px] font-semibold">
              {hidden.length}
            </span>
          )}
        </button>

        {menuOpen && (
          <>
            {/* Fond cliquable pour fermer */}
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-50 w-56 rounded-md border border-pea-gray/30 bg-white shadow-lg p-2">
              <p className="text-[10px] uppercase tracking-wide text-pea-gray font-medium px-2 pb-1.5">
                Colonnes affichées
              </p>
              <div className="max-h-72 overflow-y-auto">
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-pea-cream cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!hidden.includes(c.key)}
                      onChange={() => toggleCol(c.key)}
                      className="h-3.5 w-3.5 accent-pea-teal"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
              {hidden.length > 0 && (
                <button
                  type="button"
                  onClick={() => writeStore(storageKey, [])}
                  className="w-full mt-1 text-xs text-pea-teal hover:underline text-left px-2 py-1"
                >
                  Tout réafficher
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Barre de défilement horizontale du HAUT (synchronisée) */}
      {needsScroll && (
        <div
          ref={topRef}
          onScroll={syncFromTop}
          className="overflow-x-auto overflow-y-hidden pea-scrollbar"
          aria-hidden="true"
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}

      {/* Conteneur principal */}
      <div
        ref={scrollRef}
        onScroll={syncFromMain}
        className={`rounded-lg border border-pea-gray/20 overflow-x-auto pea-scrollbar ${hideCls}`}
      >
        {children}
      </div>
    </div>
  );
}
