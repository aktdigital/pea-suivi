"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Champ de recherche contrôlé avec debounce : la valeur tapée reste locale
 * (jamais mangée par une navigation serveur) et n'est propagée à l'URL
 * qu'après une pause de saisie. Corrige la recherche « qui ne fonctionne pas » :
 * l'ancien code déclenchait une navigation serveur complète à CHAQUE frappe.
 */
export function DebouncedSearchInput({
  initialValue,
  onCommit,
  placeholder,
  className,
  delay = 400,
}: {
  initialValue: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Toujours la dernière version du callback (évite les fermetures obsolètes)
  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <Input
      type="search"
      placeholder={placeholder}
      value={value}
      className={className}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommitRef.current(v), delay);
      }}
    />
  );
}
