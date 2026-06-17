import { Download } from "lucide-react";

interface ExportCsvButtonProps {
  href: string;
}

/**
 * Bouton de téléchargement CSV — composant serveur simple.
 * Style cohérent avec le variant "outline" du projet.
 */
export function ExportCsvButton({ href }: ExportCsvButtonProps) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 border border-pea-gray/40 bg-pea-cream text-pea-blue hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:size-4 [&_svg]:shrink-0"
    >
      <Download />
      Télécharger CSV
    </a>
  );
}
