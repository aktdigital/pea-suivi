import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, ListChecks, CalendarRange, Users, LogOut, Layers, TrendingUp } from "lucide-react";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/operations", label: "Opérations", icon: ListChecks },
  { href: "/bilans", label: "Bilans", icon: CalendarRange },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/produits-structures", label: "Produits Structurés", icon: Layers },
  { href: "/engagement-structure", label: "Suivi des engagements structurés", icon: TrendingUp },
];

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    if (profile?.full_name) displayName = profile.full_name;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ backgroundColor: "#284460" }}>
        {/* Logo */}
        <div className="px-5 py-6 flex flex-col items-start gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
          <Image src="/pea-logo-blanc.svg" alt="PEA" width={100} height={48} priority />
          <span className="text-xs tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.60)" }}>
            Pôle assistance commerciale
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors text-white/80 hover:text-white"
              style={{
                /* active state handled by group hover; real active would need usePathname in client */
              }}
            >
              <item.icon className="size-4 shrink-0" style={{ color: "#3bb6ac" }} />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}>
          <div className="px-3 py-2 text-xs truncate italic" style={{ color: "rgba(255,255,255,0.50)" }}>
            {displayName}
          </div>
          <form action={logout}>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-white/60 hover:text-white hover:bg-white/5"
            >
              <LogOut className="size-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-auto bg-pea-cream">
        <div className="p-6 max-w-screen-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
