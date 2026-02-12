"use client";

import { useEffect, useState } from "react";
import {
    Box,
    Tag,
    FileText,
    Users,
    TrendingUp,
    AlertCircle,
    Clock,
    ArrowRight
} from "lucide-react";
import Link from "next/link";

interface Stats {
    items: number;
    categorias: number;
    plantillas: number;
    usuarios: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({ items: 0, categorias: 0, plantillas: 0, usuarios: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [itemsRes, catRes, platRes, userRes] = await Promise.all([
                    fetch("/api/items"),
                    fetch("/api/categorias"),
                    fetch("/api/plantillas"),
                    fetch("/api/users"),
                ]);

                const [items, cats, plats, users] = await Promise.all([
                    itemsRes.json(),
                    catRes.json(),
                    platRes.json(),
                    userRes.json(),
                ]);

                setStats({
                    items: Array.isArray(items) ? items.length : 0,
                    categorias: Array.isArray(cats) ? cats.length : 0,
                    plantillas: Array.isArray(plats) ? plats.length : 0,
                    usuarios: Array.isArray(users) ? users.length : 0,
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: "Items Totales", value: stats.items, icon: Box, color: "text-blue-500", bg: "bg-blue-50", darkBg: "dark:bg-blue-900/10", href: "/items" },
        { label: "Categorías", value: stats.categorias, icon: Tag, color: "text-green-500", bg: "bg-green-50", darkBg: "dark:bg-green-900/10", href: "/categorias" },
        { label: "Plantillas", value: stats.plantillas, icon: FileText, color: "text-orange-500", bg: "bg-orange-50", darkBg: "dark:bg-orange-900/10", href: "/plantillas" },
        { label: "Usuarios", value: stats.usuarios, icon: Users, color: "text-purple-500", bg: "bg-purple-50", darkBg: "dark:bg-purple-900/10", href: "/users" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Panel de Control</h1>
                <p className="text-muted-foreground mt-1 font-bold">Bienvenido al sistema de inventario K-Lab</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={i}
                            href={card.href}
                            className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${card.bg} ${card.color} transition-transform group-hover:scale-110`}>
                                    <Icon size={24} />
                                </div>
                                <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{card.label}</p>
                                <p className="text-3xl font-bold text-foreground mt-1 font-mono">
                                    {loading ? <span className="animate-pulse">...</span> : card.value}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity or Recent Items Placeholder */}
                <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Clock className="text-primary" size={20} />
                            Acciones Rápidas
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/items" className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center text-primary border border-border">
                                <Box size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Registrar Item</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Añadir nueva unidad</p>
                            </div>
                        </Link>
                        <Link href="/categorias" className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all group">
                            <div className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center text-primary border border-border">
                                <Tag size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Gestionar Categorías</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Organizar clasificación</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* System Health / Status Placeholder */}
                <div className="bg-card rounded-3xl border border-border p-6 shadow-sm flex flex-col">
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <AlertCircle className="text-orange-500" size={20} />
                        Estado del Sistema
                    </h2>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                            <span className="text-sm font-bold text-green-600">Base de Datos</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                            <span className="text-sm font-bold text-green-600">Almacenamiento</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-[10px] text-muted-foreground text-center font-bold tracking-widest uppercase">Version 1.0.0 Alpha • K-Lab Engine</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
