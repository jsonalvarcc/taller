"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import toast from "react-hot-toast";

interface Categoria {
    id: number;
    nombre: string;
}

interface Plantilla {
    id: number;
    nombre: string;
    fabricante: string;
    modelo: string;
    prefijo: string;
    categoriaId: number;
    imagenes?: string[];
}

export default function PlantillasPage() {
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState({
        nombre: "",
        fabricante: "",
        modelo: "",
        prefijo: "",
        categoriaId: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchPlantillas();
        fetchCategorias();
    }, []);

    const fetchPlantillas = async () => {
        try {
            const res = await fetch("/api/plantillas");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setPlantillas(data);
            } else {
                console.error("Error fetching templates:", data.error || "Unknown error");
                setPlantillas([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setPlantillas([]);
        } finally {
            setLoading(false);
        }
    };

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
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("nombre", form.nombre);
        formData.append("fabricante", form.fabricante);
        formData.append("modelo", form.modelo);
        formData.append("prefijo", form.prefijo);
        formData.append("categoriaId", form.categoriaId);
        if (selectedFile) {
            formData.append("imagenes", selectedFile);
        }

        const method = editingId ? "PUT" : "POST";
        const url = editingId ? `/api/plantillas/${editingId}` : "/api/plantillas";

        const res = await fetch(url, {
            method,
            body: formData
        });

        if (res.ok) {
            toast.success(editingId ? "Plantilla actualizada" : "Plantilla guardada");
            setForm({ nombre: "", fabricante: "", modelo: "", prefijo: "", categoriaId: "" });
            setSelectedFile(null);
            setEditingId(null);
            fetchPlantillas();
        } else {
            const errorData = await res.json();
            toast.error(errorData.error || "Error al guardar");
        }
    };

    const deletePlantilla = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar esta plantilla?")) {
            const res = await fetch(`/api/plantillas/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                toast.success("Plantilla eliminada");
                fetchPlantillas();
            } else {
                toast.error(data.error || "Error al eliminar");
            }
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Plantillas</h1>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md mb-8 border border-border">
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                    {editingId ? "Editar Plantilla" : "Nueva Plantilla"}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder="Nombre"
                        className="p-2 border border-border rounded-lg bg-background text-foreground uppercase"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value.toUpperCase() })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Fabricante"
                        className="p-2 border border-border rounded-lg bg-background text-foreground"
                        value={form.fabricante}
                        onChange={(e) => setForm({ ...form, fabricante: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Modelo"
                        className="p-2 border border-border rounded-lg bg-background text-foreground"
                        value={form.modelo}
                        onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Prefijo (ej. BRA)"
                        className="p-2 border border-border rounded-lg bg-background text-foreground uppercase"
                        value={form.prefijo}
                        onChange={(e) => setForm({ ...form, prefijo: e.target.value.toUpperCase() })}
                        required
                    />
                    <select
                        className="p-2 border border-border rounded-lg bg-input text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        value={form.categoriaId}
                        onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                        required
                    >
                        <option value="" className="bg-card">Seleccionar Categoría</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-card">{cat.nombre}</option>
                        ))}
                    </select>
                    <input
                        type="file"
                        className="p-1 border border-border rounded-lg bg-input text-foreground text-xs"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <div className="col-span-full space-x-2">
                        <button
                            type="submit"
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition font-bold shadow-md shadow-primary/10"
                        >
                            {editingId ? "Actualizar" : "Guardar"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setForm({ nombre: "", fabricante: "", modelo: "", prefijo: "", categoriaId: "" }); }}
                                className="bg-zinc-300 text-zinc-800 px-6 py-2 rounded-lg hover:bg-zinc-400 transition"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="p-8 text-center dark:text-zinc-500 col-span-full">Cargando...</p>
                ) : (
                    plantillas.map((p) => (
                        <div key={p.id} className="bg-card rounded-xl shadow-md border border-border overflow-hidden flex flex-col">
                            <div className="h-48 bg-muted relative">
                                {p.imagenes && p.imagenes.length > 0 ? (
                                    <img src={p.imagenes[0]} alt={p.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sin Imagen</div>
                                )}
                            </div>
                            <div className="p-4 flex-1">
                                <h3 className="text-lg font-bold text-foreground">{p.nombre}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{p.fabricante} - {p.modelo}</p>
                                <p className="text-xs font-mono bg-muted inline-block px-2 py-0.5 rounded mt-2 text-foreground font-bold border border-border">
                                    {p.prefijo}
                                </p>
                            </div>
                            <div className="p-4 bg-muted/30 border-t border-border flex justify-between">
                                <button
                                    onClick={() => {
                                        setEditingId(p.id);
                                        setForm({
                                            nombre: p.nombre,
                                            fabricante: p.fabricante,
                                            modelo: p.modelo,
                                            prefijo: p.prefijo,
                                            categoriaId: p.categoriaId.toString(),
                                        });
                                    }}
                                    className="text-primary hover:opacity-80 font-bold"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => deletePlantilla(p.id)}
                                    className="text-red-500 hover:text-red-600 font-medium"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
