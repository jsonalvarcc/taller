"use client";

import { useState, useEffect } from "react";
import {
    Search,
    Calendar,
    User,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRightLeft,
    ChevronRight,
    SearchX,
    ClipboardCheck,
    Box,
    Package,
    AlertTriangle,
    ArrowUpRight,
    Plus,
    X
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Prestamo {
    id: number;
    tipoUsuario: string;
    usuarioIdentificador: string;
    usuarioNombre: string;
    fechaSalida: string;
    fechaEstimadaEntrega: string;
    fechaRealEntrega: string | null;
    estado: string;
    detalles: DetallePrestamo[];
    usuarioSalida: { name: string };
    usuarioEntrega?: { name: string };
}

interface DetallePrestamo {
    id: number;
    itemId: number | null;
    piezaId: number | null;
    cantidad: number;
    devuelto: boolean;
    item?: { codigo: string; descripcion: string; imagenes: { url: string }[] };
    pieza?: { nombre: string; imagenes: { url: string }[] };
}

export default function PrestamosPage() {
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedPrestamo, setSelectedPrestamo] = useState<Prestamo | null>(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

    // Return form states
    const [returnStates, setReturnStates] = useState<Record<number, { state: string; obs: string }>>({});

    useEffect(() => {
        fetchPrestamos();
    }, []);

    const fetchPrestamos = async () => {
        try {
            const res = await fetch("/api/prestamos");
            const data = await res.json();
            setPrestamos(data);
            setIsLoading(false);
        } catch (error) {
            toast.error("Error al cargar préstamos");
        }
    };

    const handleReturn = async (prestamo: Prestamo) => {
        setSelectedPrestamo(prestamo);
        // Initialize return states
        const initialStates: Record<number, { state: string; obs: string }> = {};
        prestamo.detalles.filter(d => !d.devuelto).forEach(d => {
            initialStates[d.id] = { state: "Disponible", obs: "" };
        });
        setReturnStates(initialStates);
        setIsReturnModalOpen(true);
    };

    const submitReturn = async () => {
        if (!selectedPrestamo) return;

        const details = Object.entries(returnStates).map(([id, data]) => {
            const d = selectedPrestamo.detalles.find(det => det.id === parseInt(id));
            return {
                detalleId: parseInt(id),
                estadoDevolucion: data.state,
                observacionDevolucion: data.obs,
                itemId: d?.itemId,
                piezaId: d?.piezaId,
                cantidad: d?.cantidad
            };
        });

        try {
            const res = await fetch(`/api/prestamos/${selectedPrestamo.id}/devolucion`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ detallesDevueltos: details })
            });

            if (res.ok) {
                toast.success("Devolución procesada con éxito");
                setIsReturnModalOpen(false);
                fetchPrestamos();
            } else {
                toast.error("Error al procesar devolución");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const isOverdue = (dateStr: string) => {
        return new Date(dateStr) < new Date() && !isLoading;
    };

    const filteredPrestamos = prestamos.filter(p =>
        p.usuarioNombre.toLowerCase().includes(search.toLowerCase()) ||
        p.usuarioIdentificador.includes(search) ||
        p.detalles.some(d => (d.item?.descripcion || d.pieza?.nombre || "").toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Gestión de <span className="text-primary italic">Préstamos</span></h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Control de salida y entrada de equipo</p>
                </div>
                <Link
                    href="/prestamos/nuevo"
                    className="h-14 px-8 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-primary/20 active:scale-95 transition-all shadow-lg"
                >
                    Nuevo Préstamo <Plus size={20} />
                </Link>
            </div>

            <div className="relative group max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nombre, RU, CI o equipo..."
                    className="w-full h-14 pl-12 pr-6 bg-card border border-border/50 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="space-y-6">
                {filteredPrestamos.length > 0 ? (
                    filteredPrestamos.map(p => (
                        <div key={p.id} className={`bg-card border-2 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl flex flex-col lg:flex-row gap-8 items-start ${p.estado === 'Devuelto' ? 'border-border/30 opacity-80' : isOverdue(p.fechaEstimadaEntrega) ? 'border-red-500/20 shadow-red-500/5' : 'border-primary/5'}`}>
                            {/* Left: User Info */}
                            <div className="space-y-4 w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border/50 pb-6 lg:pb-0 lg:pr-8">
                                <div className="space-y-1">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit inline-block ${p.estado === 'Devuelto' ? 'bg-green-500/10 text-green-600' : isOverdue(p.fechaEstimadaEntrega) ? 'bg-red-500/10 text-red-600 animate-pulse' : 'bg-blue-500/10 text-blue-600'}`}>
                                        {p.estado === 'Devuelto' ? 'Completado' : isOverdue(p.fechaEstimadaEntrega) ? 'Atrasado' : 'Vigente'}
                                    </div>
                                    <h3 className="text-xl font-black text-foreground pt-2 leading-tight">{p.usuarioNombre}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.tipoUsuario}: <span className="text-foreground">{p.usuarioIdentificador}</span></p>
                                </div>
                                <div className="space-y-3 pt-4">
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Clock size={14} className="text-primary" />
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest">Salida</p>
                                            <p className="text-[10px] font-bold text-foreground italic">{new Date(p.fechaSalida).toLocaleDateString()} {new Date(p.fechaSalida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <Calendar size={14} className="text-primary" />
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black uppercase tracking-widest">Estimado</p>
                                            <p className="text-[10px] font-bold text-foreground italic">{new Date(p.fechaEstimadaEntrega).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Items List */}
                            <div className="flex-1 space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Artículos prestados</p>
                                <div className="flex flex-wrap gap-3">
                                    {p.detalles.map(d => (
                                        <div key={d.id} className={`flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-muted/20 ${d.devuelto ? 'grayscale opacity-50' : ''}`}>
                                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-background shrink-0">
                                                {d.item?.imagenes?.[0]?.url || d.pieza?.imagenes?.[0]?.url ? (
                                                    <img src={d.item?.imagenes?.[0]?.url || d.pieza?.imagenes?.[0]?.url} className="w-full h-full object-cover" />
                                                ) : <Package className="p-2 text-muted-foreground/30" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-foreground">{d.item?.codigo || d.pieza?.nombre}</p>
                                                <p className="text-[10px] font-black text-primary uppercase">{d.cantidad} Unidad(es)</p>
                                            </div>
                                            {d.devuelto && <CheckCircle2 className="text-green-500 ml-2" size={16} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="w-full lg:w-48 flex flex-col justify-center gap-4 lg:items-end">
                                {p.estado !== 'Devuelto' ? (
                                    <button
                                        onClick={() => handleReturn(p)}
                                        className="w-full h-14 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-foreground/10"
                                    >
                                        Devolución <ArrowRightLeft size={16} />
                                    </button>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground">Recibido por</p>
                                        <p className="text-[10px] font-bold text-green-600">{p.usuarioEntrega?.name || "Sistema"}</p>
                                        <p className="text-[9px] text-muted-foreground italic">{new Date(p.fechaRealEntrega!).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <SearchX size={64} className="text-muted-foreground" />
                        <div className="space-y-1">
                            <h3 className="text-lg font-black uppercase tracking-widest text-foreground">No hay préstamos</h3>
                            <p className="text-xs font-bold text-muted-foreground">Intenta con otra búsqueda o crea un nuevo préstamo</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Return Modal */}
            {isReturnModalOpen && selectedPrestamo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-2xl rounded-[3rem] border border-border/50 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-foreground">Procesar <span className="text-primary italic">Devolución</span></h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedPrestamo.usuarioNombre}</p>
                            </div>
                            <button onClick={() => setIsReturnModalOpen(false)} className="p-3 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-8">
                            <div className="space-y-4">
                                {selectedPrestamo.detalles.filter(d => !d.devuelto).map(d => (
                                    <div key={d.id} className="p-6 bg-muted/20 border border-border/30 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-background border border-border p-2">
                                                <Box className="w-full h-full text-primary/40" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-foreground uppercase">{d.item?.codigo || d.pieza?.nombre}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.cantidad} Unidad(es)</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">¿Cómo vuelve?</label>
                                                <select
                                                    className="w-full h-12 px-4 bg-background border border-border rounded-xl font-bold text-xs outline-none focus:border-primary"
                                                    value={returnStates[d.id]?.state}
                                                    onChange={(e) => setReturnStates({ ...returnStates, [d.id]: { ...returnStates[d.id], state: e.target.value } })}
                                                >
                                                    <option value="Disponible">Perfecto Estado (Disponible)</option>
                                                    <option value="Dañado">Dañado (Necesita Reparación)</option>
                                                    <option value="Perdido">Perdido</option>
                                                    <option value="Mantenimiento">Mantenimiento Preventivo</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Observaciones</label>
                                                <input
                                                    type="text"
                                                    placeholder="Rayones, falta tornillo, etc..."
                                                    className="w-full h-12 px-4 bg-background border border-border rounded-xl font-bold text-xs outline-none focus:border-primary"
                                                    value={returnStates[d.id]?.obs}
                                                    onChange={(e) => setReturnStates({ ...returnStates, [d.id]: { ...returnStates[d.id], obs: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-muted/10 border-t border-border/50 flex gap-4">
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="flex-1 h-14 bg-background border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={submitReturn}
                                className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            >
                                Confirmar Recepción <ClipboardCheck size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
