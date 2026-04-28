import Link from "next/link";
import { LayoutDashboard, ListChecks, CalendarRange, Users, LogOut, Layers } from "lucide-react";
import { logout } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/operations", label: "Opérations", icon: ListChecks },
  { href: "/bilans", label: "Bilans", icon: CalendarRange },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/produits-structures", label: "Produits Structurés", icon: Layers },
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
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="px-5 py-5 border-b">
          <div className="text-lg font-semibold">PEA Suivi</div>
          <div className="text-xs text-muted-foreground">Pôle assistance</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">
            {displayName}
          </div>
          <form action={logout}>
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
              <LogOut className="size-4" />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">
        <div className="p-6 max-w-screen-2xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
