"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Box,
  Tag,
  FileText,
  Users,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  Palette,
  AlertTriangle,
  History as HistoryIcon,
  ArrowRightLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "Inventario", icon: Box },
  { href: "/categorias", label: "Categorías", icon: Tag },
  { href: "/plantillas", label: "Plantillas", icon: FileText },
  { href: "/reportar", label: "Reportar", icon: AlertTriangle },
  { href: "/prestamos", label: "Préstar", icon: ArrowRightLeft },
  { href: "/historial", label: "Hist.Préstamos", icon: HistoryIcon },
  { href: "/users", label: "Usuarios", icon: Users },
];

const accents = [
  { name: "blue", color: "bg-blue-500", label: "Azul" },
  { name: "green", color: "bg-green-500", label: "Verde" },
  { name: "rose", color: "bg-rose-500", label: "Rosa" },
  { name: "orange", color: "bg-orange-500", label: "Naranja" },
  { name: "purple", color: "bg-purple-500", label: "Morado" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedAccent = localStorage.getItem("color-accent") || "blue";
    document.documentElement.setAttribute("data-color-theme", savedAccent);
  }, []);

  if (!session) return null;

  const changeAccent = (accent: string) => {
    localStorage.setItem("color-accent", accent);
    document.documentElement.setAttribute("data-color-theme", accent);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-card text-foreground rounded-xl shadow-xl border border-border lg:hidden active:scale-95 transition-all"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
              K
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">K-Lab</h1>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                Inventario
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? "text-white"
                        : "group-hover:text-primary transition-colors"
                    }
                  />
                  <span className="font-semibold">{item.label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-border space-y-6">
          {/* Theme Customization */}
          {mounted && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Palette size={12} /> Personalización
              </p>
              <div className="flex flex-wrap gap-2">
                {accents.map((a) => (
                  <button
                    key={a.name}
                    onClick={() => changeAccent(a.name)}
                    className={`w-5 h-5 rounded-full ${a.color} transition-transform hover:scale-125 focus:ring-2 focus:ring-offset-2 focus:ring-zinc-400`}
                    title={a.label}
                  />
                ))}
              </div>
              <button
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                className="flex items-center justify-between w-full p-2.5 rounded-xl bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground transition-all border border-transparent hover:border-border"
              >
                <span>
                  MODO {resolvedTheme === "dark" ? "CLARO" : "OSCURO"}
                </span>
                {resolvedTheme === "dark" ? (
                  <Sun size={14} />
                ) : (
                  <Moon size={14} />
                )}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground border border-border">
                {session.user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-foreground truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 w-full px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors font-bold text-xs"
            >
              <LogOut size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
}
