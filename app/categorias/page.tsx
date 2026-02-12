"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import toast from "react-hot-toast";

interface Categoria {
    id: number;
    nombre: string;
    prefijo: string;
}

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ nombre: "", prefijo: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchCategorias();
    }, []);

    const fetchCategorias = async () => {
        try {
            const res = await fetch("/api/categorias");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setCategorias(data);
            } else {
                console.error("Error fetching categories:", data.error || "Unknown error");
                setCategorias([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setCategorias([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `/api/categorias/${editingId}` : "/api/categorias";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
        });

        if (res.ok) {
            toast.success(editingId ? "Categoría actualizada" : "Categoría guardada");
            setForm({ nombre: "", prefijo: "" });
            setEditingId(null);
            fetchCategorias();
        } else {
            const errorData = await res.json();
            toast.error(errorData.error || "Error al guardar");
        }
    };

    const deleteCategoria = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta categoría?")) {
            const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Categoría eliminada");
                fetchCategorias();
            } else {
                toast.error(data.error || "Error al eliminar");
            }
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex justify-between items-center px-2">
                <h1 className="text-3xl font-bold text-foreground">Categorías</h1>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md mb-8 border border-border">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                    {editingId ? "Editar Categoría" : "Nueva Categoría"}
                </h2>
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Nombre (ej. ELECTRÓNICA)"
                        className="flex-1 p-2 border border-border rounded-lg bg-background text-foreground uppercase"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Prefijo (ej. ET)"
                        className="w-32 p-2 border border-border rounded-lg bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium uppercase"
                        value={form.prefijo}
                        onChange={(e) => setForm({ ...form, prefijo: e.target.value.toUpperCase() })}
                        required
                    />
                    <button
                        type="submit"
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition font-bold shadow-md shadow-primary/10"
                    >
                        {editingId ? "Actualizar" : "Guardar"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => { setEditingId(null); setForm({ nombre: "", prefijo: "" }); }}
                            className="bg-zinc-300 text-zinc-800 px-6 py-2 rounded-lg hover:bg-zinc-400 transition"
                        >
                            Cancelar
                        </button>
                    )}
                </form>
            </div>

            <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-4 text-muted-foreground uppercase text-xs font-bold tracking-widest">Nombre</th>
                            <th className="p-4 text-muted-foreground uppercase text-xs font-bold tracking-widest">Prefijo</th>
                            <th className="p-4 text-muted-foreground uppercase text-xs font-bold tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center dark:text-zinc-500">Cargando...</td></tr>
                        ) : (
                            categorias.map((cat) => (
                                <tr key={cat.id} className="border-t border-border hover:bg-muted/50 transition-colors">
                                    <td className="p-4 text-foreground font-medium">{cat.nombre}</td>
                                    <td className="p-4 text-foreground font-mono">{cat.prefijo}</td>
                                    <td className="p-4 space-x-2">
                                        <button
                                            onClick={() => { setEditingId(cat.id); setForm({ nombre: cat.nombre, prefijo: cat.prefijo }); }}
                                            className="text-primary hover:opacity-80 font-bold"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => deleteCategoria(cat.id)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
