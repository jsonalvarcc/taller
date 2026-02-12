"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, X, Box, Search, Filter, ChevronDown, Edit, Trash, AlertCircle, History, User } from "lucide-react";

interface Categoria {
    id: number;
    nombre: string;
    prefijo: string;
}

interface Plantilla {
    id: number;
    nombre: string;
    prefijo: string;
    categoriaId: number;
}

interface Item {
    id: number;
    codigo: string;
    descripcion: string;
    observacion: string;
    ubicacion: string;
    estado: string;
    plantillaId: number;
    imagenes?: string[];
    piezas?: Pieza[];
    novedades?: Novedad[];
}

interface Pieza {
    id: number;
    nombre: string;
    cantidad: number;
    observacion: string;
    itemId: number;
    estado: string;
    imagenes?: string[];
    novedades?: Novedad[];
}

interface Novedad {
    id: number;
    tipo: string;
    descripcion: string;
    fecha: string;
    itemId: number;
    userId: string;
    itemNuevoEstado: string | null;
    usuarioNombre?: string;
    detalles?: {
        piezaNombre: string;
        cantidad: number | null;
        nuevoEstado: string | null;
    }[];
}

export default function ItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInstantiating, setIsInstantiating] = useState(false);

    // Form state
    const [form, setForm] = useState({
        categoriaId: "",
        plantillaId: "",
        codigo: "",
        descripcion: "",
        observacion: "",
        ubicacion: "",
        estado: "Disponible",
    });
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

    // Search state
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategoria, setSelectedCategoria] = useState<string>("all");
    const [selectedEstado, setSelectedEstado] = useState<string>("all");

    // Category view state
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    // Piece subform state
    const [piezasForm, setPiezasForm] = useState<{ id?: number, nombre: string, cantidad: number, observacion: string, files: FileList | null }[]>([]);
    const [deletedPiezaIds, setDeletedPiezaIds] = useState<number[]>([]);
    const [viewingItem, setViewingItem] = useState<Item | null>(null);
    const [novedadModal, setNovedadModal] = useState<{ isOpen: boolean, itemId?: number, itemCodigo?: string, itemDescripcion?: string, currentEstado?: string } | null>(null);
    const [novedadForm, setNovedadForm] = useState({
        tipo: "Dañado",
        descripcion: "",
        itemNuevoEstado: "",
        piezasAfectadas: [] as { piezaId: number, nombre: string, cantidad: number, nuevoEstado: string, maxCantidad: number }[]
    });
    const [isSavingNovedad, setIsSavingNovedad] = useState(false);

    // Novedad piece helpers
    const novedadPiezaExists = (piezaId: number) => {
        return novedadForm.piezasAfectadas.find(p => p.piezaId === piezaId);
    };

    const toggleNovedadPieza = (pieza: Pieza) => {
        const exists = novedadPiezaExists(pieza.id);
        if (exists) {
            setNovedadForm({
                ...novedadForm,
                piezasAfectadas: novedadForm.piezasAfectadas.filter(p => p.piezaId !== pieza.id)
            });
        } else {
            setNovedadForm({
                ...novedadForm,
                piezasAfectadas: [...novedadForm.piezasAfectadas, {
                    piezaId: pieza.id,
                    nombre: pieza.nombre,
                    cantidad: 1,
                    nuevoEstado: pieza.estado || "Disponible",
                    maxCantidad: pieza.cantidad
                }]
            });
        }
    };

    const updateNovedadPieza = (piezaId: number, field: string, value: any) => {
        setNovedadForm({
            ...novedadForm,
            piezasAfectadas: novedadForm.piezasAfectadas.map(p =>
                p.piezaId === piezaId ? { ...p, [field]: value } : p
            )
        });
    };



    useEffect(() => {
        fetchInitialData();

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
                setViewingItem(null);
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);


    const fetchInitialData = async () => {
        try {
            const [resItems, resCats, resPlats] = await Promise.all([
                fetch("/api/items"),
                fetch("/api/categorias"),
                fetch("/api/plantillas")
            ]);

            const [itemsData, catsData, platsData] = await Promise.all([
                resItems.json(),
                resCats.json(),
                resPlats.json()
            ]);

            if (Array.isArray(itemsData)) setItems(itemsData);
            if (Array.isArray(catsData)) setCategorias(catsData);
            if (Array.isArray(platsData)) setPlantillas(platsData);
        } catch (error) {
            console.error("Error fetching initial data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered templates based on category
    const filteredPlantillas = useMemo(() => {
        if (!form.categoriaId) return [];
        return plantillas.filter(p => p.categoriaId === parseInt(form.categoriaId));
    }, [form.categoriaId, plantillas]);

    // Intelligent Filter Logic
    const filteredItems = useMemo(() => {
        let result = items;

        // 0. Filter by Selected Category ID (from category view)
        if (selectedCategoryId !== null) {
            result = result.filter(item => {
                const plantilla = plantillas.find(p => p.id === item.plantillaId);
                return plantilla?.categoriaId === selectedCategoryId;
            });
        }

        // 1. Filter by Categoria (from filter dropdown)
        if (selectedCategoria !== "all") {
            result = result.filter(item => {
                const plantilla = plantillas.find(p => p.id === item.plantillaId);
                return plantilla?.categoriaId === parseInt(selectedCategoria);
            });
        }

        // 2. Filter by Estado
        if (selectedEstado !== "all") {
            result = result.filter(item => item.estado === selectedEstado);
        }

        // 3. Search Term Filter
        if (searchTerm.trim()) {
            const lowTerm = searchTerm.toLowerCase();
            result = result.filter(item => {
                const plantilla = plantillas.find(p => p.id === item.plantillaId);
                const categoria = plantilla ? categorias.find(c => c.id === plantilla.categoriaId) : null;

                const matchesItem = (
                    item.codigo.toLowerCase().includes(lowTerm) ||
                    item.descripcion.toLowerCase().includes(lowTerm) ||
                    (item.observacion && item.observacion.toLowerCase().includes(lowTerm)) ||
                    item.ubicacion.toLowerCase().includes(lowTerm) ||
                    item.estado.toLowerCase().includes(lowTerm)
                );

                const matchesPlantilla = plantilla?.nombre.toLowerCase().includes(lowTerm);
                const matchesCategoria = categoria?.nombre.toLowerCase().includes(lowTerm);

                const matchesPiezas = item.piezas?.some(p =>
                    p.nombre.toLowerCase().includes(lowTerm) ||
                    (p.observacion && p.observacion.toLowerCase().includes(lowTerm))
                );

                return matchesItem || matchesPlantilla || matchesCategoria || matchesPiezas;
            });
        }

        return result;
    }, [items, searchTerm, selectedCategoria, selectedEstado, selectedCategoryId, plantillas, categorias]);

    // Handle Category/Template change and generate code
    const handleSequenceFetch = async (plantillaId: string) => {
        if (!plantillaId) return;

        try {
            const res = await fetch(`/api/items?plantillaId=${plantillaId}`);
            const data = await res.json();
            const count = data.count || 0;

            const cat = categorias.find(c => c.id === parseInt(form.categoriaId));
            const plat = plantillas.find(p => p.id === parseInt(plantillaId));

            if (cat && plat) {
                const generatedCode = `KL-${cat.prefijo}-${plat.prefijo}-${count + 1}`;
                setForm(prev => ({ ...prev, codigo: generatedCode }));
            }
        } catch (error) {
            console.error("Error generating code:", error);
        }
    };

    const addPiezaRow = () => {
        setPiezasForm([...piezasForm, { nombre: "", cantidad: 1, observacion: "", files: null }]);
    };

    const updatePiezaRow = (index: number, field: string, value: any) => {
        const updated = [...piezasForm];
        if (field === "cantidad") {
            const num = parseInt(value);
            (updated[index] as any)[field] = isNaN(num) ? 0 : num;
        } else {
            (updated[index] as any)[field] = value;
        }
        setPiezasForm(updated);
    };

    const removePiezaRow = (index: number) => {
        const pieceToRemove = piezasForm[index];
        if (pieceToRemove.id) {
            setDeletedPiezaIds([...deletedPiezaIds, pieceToRemove.id]);
        }
        setPiezasForm(piezasForm.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("codigo", form.codigo);
            formData.append("descripcion", form.descripcion);
            formData.append("observacion", form.observacion);
            formData.append("ubicacion", form.ubicacion);
            formData.append("estado", form.estado);
            formData.append("plantillaId", form.plantillaId);

            if (selectedFiles) {
                for (let i = 0; i < selectedFiles.length; i++) {
                    formData.append("imagenes", selectedFiles[i]);
                }
            }

            // Send list of images to delete
            if (editingId && imagesToDelete.length > 0) {
                formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
            }

            const method = editingId ? "PUT" : "POST";
            const url = editingId ? `/api/items/${editingId}` : "/api/items";

            const res = await fetch(url, {
                method,
                body: formData
            });

            if (res.ok) {
                const item = await res.json();

                // Handle pieces (Create, Update, Delete)
                if (piezasForm.length > 0 || deletedPiezaIds.length > 0) {
                    // 1. Delete removed pieces
                    for (const id of deletedPiezaIds) {
                        await fetch(`/api/piezas/${id}`, { method: "DELETE" });
                    }

                    // 2. Create or Update pieces
                    for (const p of piezasForm) {
                        const pData = new FormData();
                        pData.append("nombre", p.nombre);
                        pData.append("cantidad", (p.cantidad || 0).toString());
                        pData.append("observacion", p.observacion);
                        pData.append("itemId", item.id.toString());

                        if (p.files && p.files.length > 0) {
                            for (let i = 0; i < p.files.length; i++) {
                                pData.append("imagenes", p.files[i]);
                            }
                        }

                        if (p.id) {
                            // Update existing piece
                            await fetch(`/api/piezas/${p.id}`, { method: "PUT", body: pData });
                        } else {
                            // Create new piece
                            await fetch("/api/piezas", { method: "POST", body: pData });
                        }
                    }
                }

                // Reset form
                setForm({
                    categoriaId: "",
                    plantillaId: "",
                    codigo: "",
                    descripcion: "",
                    observacion: "",
                    ubicacion: "",
                    estado: "Disponible",
                });
                setSelectedFiles(null);
                setExistingImages([]);
                setImagesToDelete([]);
                setPiezasForm([]);
                setDeletedPiezaIds([]);
                setEditingId(null);
                setSuccessMessage(editingId ? "Item y piezas actualizados" : "Item y piezas creados con éxito");
                setIsModalOpen(false);
                fetchInitialData();
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error) {
            console.error("Error saving item:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordNovedad = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novedadModal || isSavingNovedad) return;

        setIsSavingNovedad(true);
        try {
            const res = await fetch("/api/novedades", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tipo: novedadForm.tipo,
                    descripcion: novedadForm.descripcion,
                    itemId: novedadModal.itemId,
                    itemNuevoEstado: novedadForm.itemNuevoEstado || undefined,
                    detalles: novedadForm.piezasAfectadas.map(p => ({
                        piezaId: p.piezaId,
                        cantidad: p.cantidad,
                        nuevoEstado: p.nuevoEstado
                    }))
                })
            });

            if (res.ok) {
                setSuccessMessage("Novedad maestra registrada con éxito");
                setNovedadModal(null);
                setNovedadForm({
                    tipo: "Dañado",
                    descripcion: "",
                    itemNuevoEstado: "",
                    piezasAfectadas: []
                });

                if (viewingItem) {
                    const freshRes = await fetch(`/api/items/${viewingItem.id}`);
                    const freshItem = await freshRes.json();
                    setViewingItem(freshItem);
                }
                fetchInitialData();
                setTimeout(() => setSuccessMessage(null), 5000);
            }
        } catch (error) {
            console.error("Error recording novedad:", error);
            alert("Error al registrar novedad");
        } finally {
            setIsSavingNovedad(false);
        }
    };

    const handleInstantiate = async () => {
        const numInstances = prompt("¿Cuántas instancias deseas crear?", "1");
        if (!numInstances || isNaN(parseInt(numInstances)) || parseInt(numInstances) <= 0) return;

        const countToCreate = parseInt(numInstances);
        setLoading(true);
        setIsInstantiating(true);

        try {
            // 1. Get current count to determine starting sequence
            const resCount = await fetch(`/api/items?plantillaId=${form.plantillaId}`);
            const countData = await resCount.json();
            let currentCount = countData.count || 0;

            const cat = categorias.find(c => c.id === parseInt(form.categoriaId));
            const plat = plantillas.find(p => p.id === parseInt(form.plantillaId));

            if (!cat || !plat) throw new Error("Categoría o Plantilla no encontrada");

            for (let i = 0; i < countToCreate; i++) {
                currentCount++;
                const generatedCode = `KL-${cat.prefijo}-${plat.prefijo}-${currentCount}`;

                // 2. Create the Item
                const formData = new FormData();
                formData.append("codigo", generatedCode);
                formData.append("descripcion", form.descripcion);
                formData.append("observacion", form.observacion);
                formData.append("ubicacion", form.ubicacion);
                formData.append("estado", form.estado);
                formData.append("plantillaId", form.plantillaId);

                if (selectedFiles) {
                    for (let j = 0; j < selectedFiles.length; j++) {
                        formData.append("imagenes", selectedFiles[j]);
                    }
                }

                const resItem = await fetch("/api/items", {
                    method: "POST",
                    body: formData
                });

                if (resItem.ok) {
                    const newItem = await resItem.json();

                    // 3. Create pieces for this item
                    for (const p of piezasForm) {
                        const pData = new FormData();
                        pData.append("nombre", p.nombre);
                        pData.append("cantidad", (p.cantidad || 0).toString());
                        pData.append("observacion", p.observacion);
                        pData.append("itemId", newItem.id.toString());

                        if (p.files && p.files.length > 0) {
                            for (let k = 0; k < p.files.length; k++) {
                                pData.append("imagenes", p.files[k]);
                            }
                        }
                        await fetch("/api/piezas", { method: "POST", body: pData });
                    }
                }
            }

            // Success cleanup
            setForm({
                categoriaId: "",
                plantillaId: "",
                codigo: "",
                descripcion: "",
                observacion: "",
                ubicacion: "",
                estado: "Disponible",
            });
            setSelectedFiles(null);
            setPiezasForm([]);
            setSuccessMessage(`${countToCreate} items instanciados con éxito`);
            setIsModalOpen(false);
            setTimeout(() => setSuccessMessage(null), 5000);
            fetchInitialData();

        } catch (error) {
            console.error("Error instantiating items:", error);
            alert("Error al instanciar items. Revisa la consola.");
        } finally {
            setLoading(false);
            setIsInstantiating(false);
        }
    };

    const deleteItem = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este item? Se eliminarán también sus piezas e imágenes.")) {
            try {
                setLoading(true);
                const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
                if (res.ok) {
                    setSuccessMessage("Item eliminado con éxito");
                    fetchInitialData();
                    setTimeout(() => setSuccessMessage(null), 5000);
                } else {
                    const data = await res.json();
                    alert("Error al eliminar: " + (data.error || "Error desconocido"));
                }
            } catch (error) {
                console.error("Error deleting item:", error);
                alert("Error de red al intentar eliminar el item");
            } finally {
                setLoading(false);
            }
        }
    };

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedCategoria("all");
        setSelectedEstado("all");
    };



    const isFiltered = searchTerm !== "" || selectedCategoria !== "all" || selectedEstado !== "all";

    return (
        <div className="max-w-7xl mx-auto pb-20">
            {/* Header with Search and Add Button */}
            <div className="flex flex-col gap-6 mb-10 sticky top-0 z-20 bg-background/80 backdrop-blur-md py-4 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Inventario</h1>
                        <p className="text-muted-foreground font-bold mt-1">Gestiona tus activos y piezas</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por código, piezas..."
                                className="bg-muted/50 border border-border rounded-2xl py-3 pl-12 pr-4 w-full sm:w-64 md:w-80 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all font-bold placeholder:text-muted-foreground/60"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border transition-all hover:scale-105 active:scale-95 ${showFilters || isFiltered
                                ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10"
                                : "bg-card border-border text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Filter size={18} />
                            <span>Filtros</span>
                            {isFiltered && (
                                <span className="ml-1 w-2 h-2 rounded-full bg-primary" />
                            )}
                        </button>

                        <button
                            onClick={() => {
                                setEditingId(null);
                                setForm({ categoriaId: "", plantillaId: "", codigo: "", descripcion: "", observacion: "", ubicacion: "", estado: "Disponible" });
                                setPiezasForm([]);
                                setExistingImages([]);
                                setImagesToDelete([]);
                                setSelectedFiles(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                        >
                            <Plus size={20} strokeWidth={3} />
                            <span className="whitespace-nowrap">Registrar Item</span>
                        </button>
                    </div>
                </div>

                {/* Filter Options Bar */}
                {showFilters && (
                    <div className="flex flex-wrap items-center gap-4 p-5 bg-card border border-border rounded-3xl shadow-lg animate-in slide-in-from-top-4 duration-300">
                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Por Categoría</label>
                            <select
                                className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                value={selectedCategoria}
                                onChange={(e) => setSelectedCategoria(e.target.value)}
                            >
                                <option value="all">Todas las Categorías</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px] space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Por Estado</label>
                            <select
                                className="w-full p-2.5 bg-muted/50 border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                value={selectedEstado}
                                onChange={(e) => setSelectedEstado(e.target.value)}
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="Disponible">Disponible</option>
                                <option value="En Uso">En Uso</option>
                                <option value="Reparación">Reparación</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>

                        <div className="pt-5">
                            <button
                                onClick={clearAllFilters}
                                disabled={!isFiltered}
                                className="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {successMessage && (
                <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-bold">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {successMessage}
                </div>
            )}

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-background/40 backdrop-blur-md animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="relative w-full max-w-4xl bg-card rounded-[2.5rem] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h2 className="text-2xl font-black text-foreground">
                                    {editingId ? "Editar Item" : "Registrar Nuevo Item"}
                                </h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                                    Completa los detalles del activo
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                            <form id="item-form" onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Categoria Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Categoría</label>
                                        <select
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold appearance-none cursor-pointer"
                                            value={form.categoriaId}
                                            onChange={(e) => {
                                                setForm({ ...form, categoriaId: e.target.value, plantillaId: "", codigo: "" });
                                            }}
                                            required
                                            disabled={!!editingId}
                                        >
                                            <option value="" className="bg-card">Seleccione Categoría</option>
                                            {categorias.map(c => <option key={c.id} value={c.id} className="bg-card">{c.nombre} ({c.prefijo})</option>)}
                                        </select>
                                    </div>

                                    {/* Plantilla Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Plantilla</label>
                                        <select
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold appearance-none cursor-pointer disabled:opacity-50"
                                            value={form.plantillaId}
                                            onChange={(e) => {
                                                setForm({ ...form, plantillaId: e.target.value });
                                                handleSequenceFetch(e.target.value);
                                            }}
                                            required
                                            disabled={!form.categoriaId || !!editingId}
                                        >
                                            <option value="" className="bg-card">Seleccione Plantilla</option>
                                            {filteredPlantillas.map(p => <option key={p.id} value={p.id} className="bg-card">{p.nombre} ({p.prefijo})</option>)}
                                        </select>
                                    </div>

                                    {/* Code Input */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Código del Item</label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 border border-border rounded-2xl bg-muted text-foreground font-mono font-black tracking-wider shadow-inner"
                                            value={form.codigo}
                                            readOnly
                                            placeholder="KL-CAT-PLAT-N"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Ubicación</label>
                                        <input
                                            type="text"
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold uppercase"
                                            value={form.ubicacion}
                                            onChange={(e) => setForm({ ...form, ubicacion: e.target.value.toUpperCase() })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Estado</label>
                                        <select
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold cursor-pointer"
                                            value={form.estado}
                                            onChange={(e) => setForm({ ...form, estado: e.target.value })}
                                        >
                                            <option value="Disponible" className="bg-card">Disponible</option>
                                            <option value="En Uso" className="bg-card">En Uso</option>
                                            <option value="Reparación" className="bg-card">Reparación</option>
                                            <option value="Baja" className="bg-card">Baja</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-3 space-y-4">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Gestión de Imágenes</label>

                                        {/* Existing Images */}
                                        {editingId && existingImages.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-muted-foreground font-bold">Imágenes Actuales:</p>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                    {existingImages.map((img, idx) => (
                                                        <div key={idx} className="relative group rounded-xl overflow-hidden border-2 border-border bg-muted aspect-square">
                                                            <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setImagesToDelete([...imagesToDelete, img]);
                                                                    setExistingImages(existingImages.filter((_, i) => i !== idx));
                                                                }}
                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add New Images */}
                                        <div>
                                            <label className="text-xs text-muted-foreground font-bold mb-2 block">
                                                {editingId ? "Agregar Nuevas Imágenes:" : "Seleccionar Imágenes:"}
                                            </label>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="w-full p-2.5 border border-border rounded-2xl bg-input text-foreground font-bold text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                                                onChange={(e) => setSelectedFiles(e.target.files)}
                                            />
                                            {selectedFiles && selectedFiles.length > 0 && (
                                                <p className="text-xs text-primary font-bold mt-2">
                                                    {selectedFiles.length} nueva(s) imagen(es) seleccionada(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Descripción</label>
                                        <textarea
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px] font-bold"
                                            rows={2}
                                            value={form.descripcion}
                                            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Observaciones</label>
                                        <textarea
                                            className="w-full p-3.5 border border-border rounded-2xl bg-input text-foreground outline-none focus:ring-4 focus:ring-primary/10 transition-all min-h-[120px] font-bold"
                                            rows={2}
                                            value={form.observacion}
                                            onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Pieces Subform */}
                                <div className="pt-8 border-t border-border">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="text-xl font-black text-foreground">Piezas del Item</h3>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Detalla las partes componentes</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addPiezaRow}
                                            className="text-xs bg-muted text-foreground px-5 py-2.5 rounded-xl border border-border hover:bg-muted/80 transition-all font-black uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <Plus size={14} strokeWidth={3} />
                                            Agregar Pieza
                                        </button>
                                    </div>

                                    {piezasForm.length === 0 ? (
                                        <div className="p-10 border-2 border-dashed border-border rounded-3xl text-center">
                                            <p className="text-sm text-muted-foreground font-bold">No se han agregado piezas aún.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {piezasForm.map((p, idx) => (
                                                <div key={idx} className="flex flex-wrap gap-4 p-6 bg-muted/30 rounded-[2rem] border border-border items-end shadow-inner group relative">
                                                    <div className="flex-1 min-w-[200px] space-y-1.5">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Nombre</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Nombre de la pieza"
                                                            className="w-full p-3 border border-border rounded-xl bg-input text-foreground text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold"
                                                            value={p.nombre}
                                                            onChange={(e) => updatePiezaRow(idx, "nombre", e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="w-24 space-y-1.5">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Cant.</label>
                                                        <input
                                                            type="number"
                                                            className="w-full p-3 border border-border rounded-xl bg-input text-foreground text-sm outline-none focus:ring-4 focus:ring-primary/10 font-bold"
                                                            value={p.cantidad || ""}
                                                            onChange={(e) => updatePiezaRow(idx, "cantidad", e.target.value)}
                                                            min="1"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-[200px] space-y-1.5">
                                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Imagen (Opcional)</label>
                                                        <input
                                                            type="file"
                                                            className="w-full p-2 border border-border rounded-xl bg-input text-foreground text-xs font-bold"
                                                            onChange={(e) => updatePiezaRow(idx, "files", e.target.files)}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removePiezaRow(idx)}
                                                        className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-3.5 rounded-2xl bg-card text-foreground font-black uppercase tracking-widest text-xs border border-border hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                form="item-form"
                                type="submit"
                                className="bg-primary text-primary-foreground px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? (isInstantiating ? "Instanciando..." : "Guardando...") : (editingId ? "Actualizar Item" : "Registrar Item")}
                            </button>
                            {!editingId && (
                                <button
                                    type="button"
                                    onClick={handleInstantiate}
                                    className="bg-purple-600 text-white px-10 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-700 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50"
                                    disabled={loading || !form.plantillaId}
                                >
                                    {isInstantiating ? "Instanciando..." : "Instanciar"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Category View or Items Table */}
            {selectedCategoryId === null ? (
                /* Category Cards View */
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-foreground">Selecciona una Categoría</h2>
                    </div>

                    {loading && categorias.length === 0 ? (
                        <p className="text-center py-12 text-muted-foreground font-medium">Cargando categorías...</p>
                    ) : categorias.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                <Box size={32} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-foreground">No hay categorías disponibles</p>
                                <p className="text-muted-foreground font-medium">Crea una categoría primero</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categorias.map((categoria) => {
                                const categoryItems = items.filter(item => {
                                    const plantilla = plantillas.find(p => p.id === item.plantillaId);
                                    return plantilla?.categoriaId === categoria.id;
                                });

                                return (
                                    <button
                                        key={categoria.id}
                                        onClick={() => setSelectedCategoryId(categoria.id)}
                                        className="group bg-card border border-border rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:border-primary/50 transition-all duration-300 hover:scale-105 active:scale-95 text-left relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                                        <div className="relative space-y-4">
                                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                                <Box size={32} className="text-primary" />
                                            </div>

                                            <div>
                                                <h3 className="text-2xl font-black text-foreground group-hover:text-primary transition-colors">
                                                    {categoria.nombre}
                                                </h3>
                                                <p className="text-sm text-muted-foreground font-mono font-bold mt-1">
                                                    Prefijo: {categoria.prefijo}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                                <div className="text-center">
                                                    <p className="text-3xl font-black text-foreground">{categoryItems.length}</p>
                                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">
                                                        {categoryItems.length === 1 ? 'Item' : 'Items'}
                                                    </p>
                                                </div>
                                                <div className="text-primary group-hover:translate-x-1 transition-transform">
                                                    <ChevronDown size={24} className="rotate-[-90deg]" />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Items Table View */
                <div className="space-y-6">
                    {/* Back Button and Category Name */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                setSelectedCategoryId(null);
                                setSearchTerm("");
                                setSelectedCategoria("all");
                                setSelectedEstado("all");
                            }}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl font-bold text-foreground flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronDown size={18} className="rotate-90" />
                            <span>Categorías</span>
                        </button>
                        <div className="flex-1">
                            <h2 className="text-2xl font-black text-foreground">
                                {categorias.find(c => c.id === selectedCategoryId)?.nombre || 'Categoría'}
                            </h2>
                            <p className="text-sm text-muted-foreground font-medium">
                                {filteredItems.length} {filteredItems.length === 1 ? 'item encontrado' : 'items encontrados'}
                            </p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                        {loading && items.length === 0 ? (
                            <p className="text-center py-12 text-muted-foreground font-medium">Cargando unidades...</p>
                        ) : filteredItems.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                                    <Search size={32} />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground">No se encontraron resultados</p>
                                    <p className="text-muted-foreground font-medium">Intenta con otros términos de búsqueda</p>
                                </div>
                                <button
                                    onClick={clearAllFilters}
                                    className="text-primary font-black uppercase tracking-widest text-xs hover:underline"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border">
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Imagen</th>
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Código</th>
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Descripción</th>
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Ubicación</th>
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Estado</th>
                                            <th className="text-left p-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden xl:table-cell">Piezas</th>
                                            <th className="text-right p-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((item) => {
                                            const plat = plantillas.find(p => p.id === item.plantillaId);
                                            const cat = plat ? categorias.find(c => c.id === plat.categoriaId) : null;

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                                                >
                                                    {/* Image */}
                                                    <td className="p-4">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
                                                            {item.imagenes && item.imagenes.length > 0 ? (
                                                                <img
                                                                    src={item.imagenes[0]}
                                                                    alt={item.codigo}
                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                    <Box size={24} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Code & Category */}
                                                    <td className="p-4">
                                                        <div className="space-y-1">
                                                            <p className="font-mono font-black text-foreground text-sm">{item.codigo}</p>
                                                            {cat && (
                                                                <p className="text-xs text-muted-foreground font-bold">{cat.nombre}</p>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Description */}
                                                    <td className="p-4 hidden md:table-cell max-w-xs">
                                                        <p className="text-sm text-foreground font-medium line-clamp-2">{item.descripcion}</p>
                                                        {item.observacion && (
                                                            <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">{item.observacion}</p>
                                                        )}
                                                    </td>

                                                    {/* Location */}
                                                    <td className="p-4 hidden lg:table-cell">
                                                        <p className="text-sm text-foreground font-medium">{item.ubicacion}</p>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase whitespace-nowrap inline-block ${item.estado === "Disponible" ? "bg-green-500/10 text-green-600 border border-green-500/20" :
                                                            item.estado === "En Uso" ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                                                                item.estado === "Reparación" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                                                                    "bg-red-500/10 text-red-600 border border-red-500/20"
                                                            }`}>
                                                            {item.estado}
                                                        </span>
                                                    </td>

                                                    {/* Pieces */}
                                                    <td className="p-4 hidden xl:table-cell">
                                                        {item.piezas && item.piezas.length > 0 ? (
                                                            <button
                                                                onClick={() => setViewingItem(item)}
                                                                className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity font-bold text-xs"
                                                            >
                                                                <Box size={14} />
                                                                <span>{item.piezas.length} pieza(s)</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Sin piezas</span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setNovedadModal({
                                                                        isOpen: true,
                                                                        itemId: item.id,
                                                                        itemCodigo: item.codigo,
                                                                        itemDescripcion: item.descripcion,
                                                                        currentEstado: item.estado
                                                                    });
                                                                    setNovedadForm(prev => ({
                                                                        ...prev,
                                                                        itemNuevoEstado: item.estado,
                                                                        piezasAfectadas: []
                                                                    }));
                                                                }}
                                                                className="p-2 hover:bg-amber-500/10 rounded-xl transition-colors text-amber-500 group/report"
                                                                title="Reportar Novedad"
                                                            >
                                                                <AlertCircle size={18} className="group-hover/report:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingId(item.id);
                                                                    const plat = plantillas.find(p => p.id === item.plantillaId);
                                                                    setForm({
                                                                        categoriaId: plat ? plat.categoriaId.toString() : "",
                                                                        plantillaId: item.plantillaId.toString(),
                                                                        codigo: item.codigo,
                                                                        descripcion: item.descripcion,
                                                                        observacion: item.observacion,
                                                                        ubicacion: item.ubicacion,
                                                                        estado: item.estado,
                                                                    });
                                                                    setExistingImages(item.imagenes || []);
                                                                    setImagesToDelete([]);
                                                                    setSelectedFiles(null);

                                                                    if (item.piezas) {
                                                                        setPiezasForm(item.piezas.map(p => ({
                                                                            id: p.id,
                                                                            nombre: p.nombre,
                                                                            cantidad: p.cantidad,
                                                                            observacion: p.observacion,
                                                                            files: null
                                                                        })));
                                                                    }
                                                                    setDeletedPiezaIds([]);
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="p-2 hover:bg-primary/10 rounded-xl transition-colors text-primary group/edit"
                                                                title="Editar"
                                                            >
                                                                <Edit size={18} className="group-hover/edit:scale-110 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteItem(item.id)}
                                                                className="p-2 hover:bg-red-500/10 rounded-xl transition-colors text-red-500 group/delete"
                                                                title="Eliminar"
                                                            >
                                                                <Trash size={18} className="group-hover/delete:scale-110 transition-transform" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Item Detail Modal */}
            {viewingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10">
                    <div
                        className="absolute inset-0 bg-background/40 backdrop-blur-2xl animate-in fade-in duration-500"
                        onClick={() => setViewingItem(null)}
                        aria-hidden="true"
                    />


                    <div className="relative w-full max-w-6xl bg-card rounded-[3rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-border/50 flex justify-between items-start bg-gradient-to-r from-primary/5 to-transparent">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-black text-foreground tracking-tight">{viewingItem.codigo}</h2>
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg ${viewingItem.estado === "Disponible" ? "bg-green-500 text-white" :
                                        viewingItem.estado === "En Uso" ? "bg-blue-500 text-white" :
                                            "bg-amber-500 text-white"
                                        }`}>
                                        {viewingItem.estado}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.2em]">Detalles completos del activo</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setNovedadModal({
                                            isOpen: true,
                                            itemId: viewingItem.id,
                                            currentEstado: viewingItem.estado
                                        });
                                        setNovedadForm(prev => ({ ...prev, nuevoEstado: viewingItem.estado }));
                                    }}
                                    className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    <AlertCircle size={16} />
                                    Reportar Problema
                                </button>
                                <button
                                    onClick={() => setViewingItem(null)}
                                    className="p-3 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground hover:scale-110 active:scale-95"
                                    aria-label="Cerrar detalles"
                                >
                                    <X size={28} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 sm:p-12 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Column: Images & Primary Info */}
                                <div className="space-y-10">
                                    {/* Image Gallery */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Galería de Imágenes</h3>
                                        {viewingItem.imagenes && viewingItem.imagenes.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {viewingItem.imagenes.map((img, idx) => (
                                                    <div key={idx} className={`rounded-[2rem] overflow-hidden border border-border/50 shadow-inner ${idx === 0 ? "col-span-2 aspect-video" : "aspect-square"}`}>
                                                        <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="aspect-video rounded-[2rem] bg-muted/30 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground font-bold">
                                                Sin imágenes disponibles
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-4 bg-muted/20 p-8 rounded-[2.5rem] border border-border/30">
                                        <h3 className="text-xs font-black text-primary uppercase tracking-widest">Descripción General</h3>
                                        <p className="text-lg text-foreground font-medium leading-relaxed italic">
                                            "{viewingItem.descripcion}"
                                        </p>
                                    </div>
                                </div>

                                {/* Right Column: Details & Pieces */}
                                <div className="space-y-10">
                                    {/* Tech Info Grid */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-muted/10 p-6 rounded-3xl border border-border/20">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Ubicación Actual</p>
                                            <p className="text-base font-bold text-foreground">{viewingItem.ubicacion}</p>
                                        </div>
                                        <div className="bg-muted/10 p-6 rounded-3xl border border-border/20">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">ID del Sistema</p>
                                            <p className="text-base font-bold text-foreground"># {viewingItem.id}</p>
                                        </div>
                                    </div>

                                    {/* Observations */}
                                    {viewingItem.observacion && (
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Observaciones Técnicas</h3>
                                            <div className="p-6 bg-card border border-border/50 rounded-3xl shadow-sm text-sm text-muted-foreground font-medium leading-relaxed">
                                                {viewingItem.observacion}
                                            </div>
                                        </div>
                                    )}

                                    {/* Pieces List */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-xl font-black text-foreground">Piezas de Repuesto ({viewingItem.piezas?.length || 0})</h3>
                                        </div>

                                        {!viewingItem.piezas || viewingItem.piezas.length === 0 ? (
                                            <div className="p-8 border-2 border-dashed border-border/50 rounded-[2.5rem] text-center text-muted-foreground font-bold bg-muted/5">
                                                No hay piezas asociadas a este item.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {viewingItem.piezas.map((pieza, pIdx) => (
                                                    <div key={pIdx} className="group p-6 bg-card border border-border/50 rounded-[2rem] flex items-center gap-6 hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                                                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted flex-shrink-0 border border-border/20 shadow-inner">
                                                            {pieza.imagenes && pieza.imagenes.length > 0 ? (
                                                                <img src={pieza.imagenes[0]} alt={pieza.nombre} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground scale-75"><Box size={24} /></div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="text-lg font-black text-foreground truncate">{pieza.nombre}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            setNovedadModal({
                                                                                isOpen: true,
                                                                                itemId: viewingItem.id,
                                                                                itemCodigo: viewingItem.codigo,
                                                                                itemDescripcion: viewingItem.descripcion,
                                                                                currentEstado: viewingItem.estado
                                                                            });
                                                                            setNovedadForm(prev => ({
                                                                                ...prev,
                                                                                itemNuevoEstado: viewingItem.estado,
                                                                                piezasAfectadas: [{
                                                                                    piezaId: pieza.id,
                                                                                    nombre: pieza.nombre,
                                                                                    cantidad: 1,
                                                                                    nuevoEstado: pieza.estado,
                                                                                    maxCantidad: pieza.cantidad
                                                                                }]
                                                                            }));
                                                                        }}
                                                                        className="p-2 hover:bg-amber-500/10 text-amber-500 rounded-xl transition-all"
                                                                        title="Reportar novedad en pieza"
                                                                    >
                                                                        <AlertCircle size={18} />
                                                                    </button>
                                                                    <div className="flex flex-col items-end gap-1">
                                                                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">x{pieza.cantidad}</span>
                                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${(pieza as any).estado === "Disponible" ? "bg-green-500/10 text-green-600" :
                                                                            (pieza as any).estado === "En Uso" ? "bg-blue-500/10 text-blue-600" :
                                                                                (pieza as any).estado === "Reparación" ? "bg-amber-500/10 text-amber-600" :
                                                                                    "bg-red-500/10 text-red-600"
                                                                            }`}>
                                                                            {(pieza as any).estado || "Disponible"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground line-clamp-2 italic">{pieza.observacion || "Sin observaciones adicionales"}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* History / Audit Timeline */}
                                    <div className="space-y-6 pt-6 border-t border-border/50">
                                        <div className="flex items-center gap-2 px-1">
                                            <History className="text-primary" size={24} />
                                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Historial de Novedades / Auditoría</h3>
                                        </div>

                                        {!viewingItem.novedades || viewingItem.novedades.length === 0 ? (
                                            <div className="p-8 bg-muted/5 border border-dashed border-border rounded-3xl text-center text-sm text-muted-foreground font-medium italic">
                                                No se han registrado novedades para este item todavía.
                                            </div>
                                        ) : (
                                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/50 before:to-transparent">
                                                {viewingItem.novedades.map((nov, nIdx) => (
                                                    <div key={nIdx} className="relative flex items-start gap-6 group">
                                                        <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shadow-lg z-10 shrink-0 ${nov.tipo === 'Dañado' ? 'bg-red-500' :
                                                            nov.tipo === 'Perdido' ? 'bg-orange-500' :
                                                                nov.tipo === 'Mantenimiento' ? 'bg-blue-500' :
                                                                    'bg-amber-500'
                                                            }`}>
                                                            <AlertCircle size={14} className="text-white" />
                                                        </div>
                                                        <div className="flex-1 bg-muted/10 p-5 rounded-3xl border border-border/20 group-hover:bg-muted/20 transition-colors">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                                <span className="text-sm font-black text-foreground uppercase tracking-wider">
                                                                    {nov.tipo}
                                                                    {nov.itemNuevoEstado && ` (Item: → ${nov.itemNuevoEstado})`}
                                                                </span>
                                                                <time className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(nov.fecha).toLocaleString()}</time>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{nov.descripcion}</p>

                                                            {nov.detalles && nov.detalles.length > 0 && (
                                                                <div className="mb-4 space-y-2">
                                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">Piezas Afectadas</p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                        {nov.detalles.map((det: any, detIdx: number) => (
                                                                            <div key={detIdx} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-2xl">
                                                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                                                    <Box size={14} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-black uppercase text-foreground truncate max-w-[120px]">{det.piezaNombre || 'Pieza'}</p>
                                                                                    <p className="text-[8px] font-bold text-muted-foreground">Cant: {det.cantidad || 1} | Est: <span className="text-primary italic">{det.nuevoEstado}</span></p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-2 pt-3 border-t border-border/20">
                                                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                                    <User size={12} className="text-primary" />
                                                                </div>
                                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reportado por: <span className="text-foreground">{nov.usuarioNombre}</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-border/50 bg-muted/10 flex justify-end gap-4">
                            <button
                                onClick={() => setViewingItem(null)}
                                className="px-10 py-4 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-xs hover:opacity-90 transition-all shadow-xl shadow-foreground/10 active:scale-95"
                                aria-label="Cerrar vista detallada"
                            >
                                Cerrar Vista
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Novedad Modal */}
            {novedadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setNovedadModal(null)} />
                    <div className="relative w-full max-w-md bg-card rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-transparent">
                            <div>
                                <h2 className="text-2xl font-black text-foreground tracking-tight">Reportar Novedad</h2>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Auditoría de Incidencias</p>
                            </div>
                            <button onClick={() => setNovedadModal(null)} className="p-2 hover:bg-muted rounded-xl transition-all"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleRecordNovedad} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Activo</p>
                                    <p className="text-sm font-bold text-foreground">{novedadModal.itemCodigo} - {novedadModal.itemDescripcion}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Tipo</label>
                                        <select
                                            className="w-full h-12 bg-muted/40 border-none rounded-2xl px-4 font-bold text-foreground text-xs focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={novedadForm.tipo}
                                            onChange={(e) => setNovedadForm({ ...novedadForm, tipo: e.target.value })}
                                        >
                                            <option value="Dañado">⚠️ Dañado</option>
                                            <option value="Perdido">❌ Perdido</option>
                                            <option value="Mantenimiento">🔧 Mantenimiento</option>
                                            <option value="Falla">⚡ Falla</option>
                                            <option value="Nota">📝 Nota</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Estado del Item</label>
                                        <select
                                            className="w-full h-12 bg-primary/5 border border-primary/20 rounded-2xl px-4 font-black text-primary text-xs focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            value={novedadForm.itemNuevoEstado}
                                            onChange={(e) => setNovedadForm({ ...novedadForm, itemNuevoEstado: e.target.value })}
                                        >
                                            <option value="Disponible">Disponible</option>
                                            <option value="En Uso">En Uso</option>
                                            <option value="Reparación">Reparación</option>
                                            <option value="Baja">Baja</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Descripción</label>
                                    <textarea
                                        className="w-full min-h-[100px] bg-muted/40 border-none rounded-2xl p-4 font-medium text-sm text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                                        placeholder="Describe lo sucedido..."
                                        value={novedadForm.descripcion}
                                        onChange={(e) => setNovedadForm({ ...novedadForm, descripcion: e.target.value })}
                                        required
                                    />
                                </div>

                                {viewingItem?.piezas && viewingItem.piezas.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Piezas Afectadas</label>
                                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {viewingItem.piezas.map(pieza => {
                                                const isSelected = novedadPiezaExists(pieza.id);
                                                return (
                                                    <div key={pieza.id} className={`p-3 rounded-2xl border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border/30 bg-muted/10'}`}>
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!isSelected}
                                                                    onChange={() => toggleNovedadPieza(pieza)}
                                                                    className="w-4 h-4 rounded accent-primary cursor-pointer"
                                                                />
                                                                <div>
                                                                    <p className="font-black text-foreground text-[10px] uppercase truncate max-w-[120px]">{pieza.nombre}</p>
                                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{pieza.estado || 'Disponible'}</p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="flex gap-2 items-center flex-1 justify-end">
                                                                    <input
                                                                        type="number"
                                                                        value={isSelected.cantidad}
                                                                        onChange={(e) => updateNovedadPieza(pieza.id, 'cantidad', parseInt(e.target.value))}
                                                                        className="w-12 h-8 bg-card border-border border rounded-lg px-1 text-center font-bold text-[10px]"
                                                                        min="1"
                                                                        max={pieza.cantidad}
                                                                    />
                                                                    <select
                                                                        value={isSelected.nuevoEstado}
                                                                        onChange={(e) => updateNovedadPieza(pieza.id, 'nuevoEstado', e.target.value)}
                                                                        className="h-8 bg-card border-border border rounded-lg px-2 font-bold text-[8px] uppercase"
                                                                    >
                                                                        <option value="Disponible">Disponible</option>
                                                                        <option value="En Uso">En Uso</option>
                                                                        <option value="Reparación">Reparación</option>
                                                                        <option value="Baja">Baja</option>
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setNovedadModal(null)}
                                    className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all border border-border"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingNovedad}
                                    className="flex-[2] h-12 bg-primary text-primary-foreground rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSavingNovedad ? "Registrando..." : "Reportar Incidencia"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


