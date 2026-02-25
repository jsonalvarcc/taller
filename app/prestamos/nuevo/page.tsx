"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search,
    ShoppingCart,
    User,
    Calendar,
    Box,
    Package,
    Plus,
    Minus,
    Trash2,
    ArrowRight,
    X,
    ChevronDown,
    ChevronUp,
    Layers,
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    Info,
    LayoutGrid,
    Check
} from "lucide-react";
import { toast } from "react-hot-toast";

interface ExternalUser {
    id: string;
    tipo: "Estudiante" | "Externo";
    nombres: string;
    apellidop: string;
    apellidom: string;
    correo?: string;
    celular?: string;
}

interface Item {
    id: number;
    codigo: string;
    descripcion: string;
    estado: string;
    imagenes: string[];
    piezas: Pieza[];
}

interface Pieza {
    id: number;
    nombre: string;
    cantidad: number;
    estado: string;
    imagenes: string[];
}

interface CartItem {
    id: string; // "item-1" or "pieza-5"
    tipo: "Item" | "Pieza";
    targetId: number;
    nombre: string;
    codigo?: string;
    cantidad: number;
    maxCantidad: number;
    imagen?: string;
    estado: string;
}

export default function NuevoPrestamoPage() {
    // Data states
    const [items, setItems] = useState<Item[]>([]);
    const [loanedItems, setLoanedItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI states
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // User search states
    const [userQuery, setUserQuery] = useState("");
    const [userType, setUserType] = useState<"Estudiante" | "Externo">("Estudiante");
    const [userResults, setUserResults] = useState<ExternalUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<ExternalUser | null>(null);
    const [isSearchingUser, setIsSearchingUser] = useState(false);

    const [returnDate, setReturnDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedItem, setExpandedItem] = useState<number | null>(null);
    const [isConfirmed, setIsConfirmed] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [itemsRes, prestamosRes] = await Promise.all([
                    fetch("/api/items"),
                    fetch("/api/prestamos")
                ]);
                const itemsData = await itemsRes.json();
                const prestamosData = await prestamosRes.json();

                setItems(itemsData);
                setLoanedItems(prestamosData);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
                toast.error("Error al cargar datos");
            }
        };
        fetchData();
    }, []);

    // Availability calculation logic
    const getAvailability = (type: "Item" | "Pieza", id: number, total: number) => {
        let loaned = 0;
        loanedItems.forEach(p => {
            if (p.estado === "Vigente") {
                p.detalles.forEach((d: any) => {
                    if (type === "Item" && d.itemId === id) loaned += 1;
                    if (type === "Pieza" && d.piezaId === id) loaned += d.cantidad;
                });
            }
        });
        const inCart = cart.find(c => c.tipo === type && c.targetId === id)?.cantidad || 0;
        return total - loaned - inCart;
    };

    const isBadState = (estado: string) => {
        const badStates = ["Malo", "Dañado", "Mantenimiento", "Perdido"];
        return badStates.some(s => (estado || "").toLowerCase().includes(s.toLowerCase()));
    };

    const handleSearchUser = async () => {
        if (!userQuery) return;
        setIsSearchingUser(true);
        try {
            const res = await fetch(`/api/external-users/search?q=${userQuery}&type=${userType}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setUserResults(data);
            if (data.length === 0) toast.error("No se encontraron usuarios");
        } catch (error: any) {
            toast.error(error.message || "Error al buscar usuario");
        } finally {
            setIsSearchingUser(false);
        }
    };

    const addToCart = (type: "Item" | "Pieza", target: any) => {
        if (isBadState(target.estado)) {
            toast.error(`No se puede prestar: ${target.estado}`, { icon: '⚠️' });
            return;
        }

        const id = `${type.toLowerCase()}-${target.id}`;
        const existing = cart.find(c => c.id === id);
        const available = getAvailability(type, target.id, target.cantidad || 1);

        if (available <= 0) {
            toast.error("No hay stock disponible");
            return;
        }

        if (existing) {
            setCart(cart.map(c => c.id === id ? { ...c, cantidad: c.cantidad + 1 } : c));
        } else {
            setCart([...cart, {
                id,
                tipo: type,
                targetId: target.id,
                nombre: type === "Pieza" ? target.nombre : target.descripcion,
                codigo: type === "Item" ? target.codigo : undefined,
                cantidad: 1,
                maxCantidad: target.cantidad || 1,
                imagen: target.imagenes && target.imagenes.length > 0 ? target.imagenes[0] : undefined,
                estado: target.estado
            }]);
        }
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const updateCartQuantity = (id: string, delta: number) => {
        setCart(cart.map(c => {
            if (c.id === id) {
                const newQty = c.cantidad + delta;
                const available = getAvailability(c.tipo, c.targetId, c.maxCantidad);
                if (newQty > 0 && (delta < 0 || available > 0)) {
                    return { ...c, cantidad: newQty };
                }
            }
            return c;
        }));
    };

    const handleFinalize = async () => {
        // Validation with clear toasts
        if (!selectedUser) {
            toast.error("ERROR: Debes seleccionar un usuario receptor", { icon: '👤', id: 'val-user' });
            return;
        }
        if (cart.length === 0) {
            toast.error("ERROR: El carrito está vacío", { icon: '🛒', id: 'val-cart' });
            return;
        }
        if (!returnDate) {
            toast.error("ERROR: Selecciona la fecha de devolución", { icon: '📅', id: 'val-date' });
            return;
        }
        if (!isConfirmed) {
            toast.error("ERROR: Debes marcar la casilla de confirmación", { icon: '🔔', id: 'val-conf' });
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Registrando préstamo oficial...");

        try {
            const body = {
                tipoUsuario: selectedUser.tipo,
                usuarioIdentificador: selectedUser.id,
                usuarioNombre: `${selectedUser.nombres} ${selectedUser.apellidop || ''} ${selectedUser.apellidom || ''}`.trim(),
                fechaEstimadaEntrega: returnDate,
                detalles: cart.map(c => ({
                    itemId: c.tipo === "Item" ? Number(c.targetId) : null,
                    piezaId: c.tipo === "Pieza" ? Number(c.targetId) : null,
                    cantidad: Number(c.cantidad)
                }))
            };

            const res = await fetch("/api/prestamos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("¡Préstamo registrado exitosamente!", { id: toastId, duration: 3000 });
                setTimeout(() => { window.location.href = "/prestamos"; }, 1500);
            } else {
                toast.error(data.error || "Error en el servidor al guardar", { id: toastId });
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Error de conexión", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = useMemo(() => {
        return items.filter(item =>
            item.codigo.toLowerCase().includes(search.toLowerCase()) ||
            item.descripcion.toLowerCase().includes(search.toLowerCase()) ||
            item.piezas.some(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
        );
    }, [items, search]);

    return (
        <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20 transition-colors duration-300">

            {/* Catalog Content */}
            <div className="max-w-[1240px] mx-auto p-4 md:p-8 space-y-8">
                <header className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <a href="/prestamos" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all text-sm font-semibold mb-2">
                                <ArrowLeft size={16} /> Volver a Préstamos
                            </a>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
                                Nuevo <span className="text-primary italic">Préstamo</span>
                            </h1>
                        </div>
                    </div>

                    <div className="relative group max-w-2xl pt-2">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" size={22} />
                        <input
                            type="text"
                            placeholder="Buscar equipos por código, descripción o piezas..."
                            className="w-full h-14 pl-14 pr-6 bg-muted/40 border-2 border-border/40 rounded-3xl font-medium text-lg focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[16/10] bg-muted/30 rounded-[2.5rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
                        {filteredItems.map(item => {
                            const itemAvail = getAvailability("Item", item.id, 1);
                            const isExpanded = expandedItem === item.id;
                            const isBad = isBadState(item.estado);

                            return (
                                <div key={item.id} className={`group bg-card border-2 ${isBad ? 'border-destructive/20' : 'border-border/50'} rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col relative`}>

                                    <div className="absolute top-6 left-6 z-20 flex gap-2">
                                        <div className="px-3 py-1.5 bg-background/90 backdrop-blur-xl rounded-2xl text-foreground border border-border/80 shadow-sm flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isBad ? 'bg-destructive animate-pulse' : (itemAvail > 0 ? 'bg-green-500' : 'bg-orange-500')}`}></div>
                                            <p className="text-[11px] font-black uppercase tracking-widest">{item.codigo}</p>
                                        </div>
                                    </div>

                                    <div className="relative aspect-[16/9] bg-muted/10 overflow-hidden">
                                        {item.imagenes?.[0] ? (
                                            <img src={item.imagenes[0]} alt={item.descripcion} className={`w-full h-full object-cover transition-all duration-1000 ${isBad ? 'grayscale opacity-60' : 'group-hover:scale-110'}`} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center opacity-10">
                                                <Box size={80} strokeWidth={1} />
                                            </div>
                                        )}

                                        {!isBad && itemAvail > 0 && (
                                            <button
                                                onClick={() => addToCart("Item", item)}
                                                className="absolute bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-[1.25rem] shadow-2xl hover:scale-110 hover:rotate-90 active:scale-95 transition-all flex items-center justify-center z-20 group/btn"
                                            >
                                                <Plus size={28} strokeWidth={3} />
                                            </button>
                                        )}
                                        {isBad && (
                                            <div className="absolute inset-0 bg-destructive/10 backdrop-blur-[1px] flex items-center justify-center">
                                                <div className="bg-destructive text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl">
                                                    <AlertTriangle size={16} /> No disponible • {item.estado}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] opacity-80">Equipo de Inventario</p>
                                            <h3 className="text-2xl font-black tracking-tighter text-foreground leading-tight uppercase line-clamp-2 italic">{item.descripcion}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${isBad ? 'border-destructive/20 bg-destructive/5 text-destructive' : 'border-primary/10 bg-primary/5 text-primary'}`}>
                                                    {isBad ? item.estado : (itemAvail > 0 ? "DISPONIBLE" : "OCUPADO")}
                                                </span>
                                            </div>
                                        </div>

                                        {item.piezas.length > 0 && (
                                            <div className="space-y-4 pt-6 border-t border-border/50">
                                                <button
                                                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2 ${isExpanded ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20' : 'bg-muted/30 border-transparent text-muted-foreground hover:border-border/50 hover:bg-muted/50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Layers size={18} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">Piezas ({item.piezas.length})</span>
                                                    </div>
                                                    {isExpanded ? <Minus size={18} /> : <Plus size={18} />}
                                                </button>

                                                {isExpanded && (
                                                    <div className="grid grid-cols-1 gap-4 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                                                        {item.piezas.map((pieza) => {
                                                            const avail = getAvailability("Pieza", pieza.id, pieza.cantidad);
                                                            const piezaBad = isBadState(pieza.estado);
                                                            return (
                                                                <div key={pieza.id} className={`flex items-center gap-5 p-4 rounded-[1.5rem] transition-all ${piezaBad ? 'bg-destructive/5 border-2 border-destructive/20 opacity-70 grayscale' : 'bg-muted/10 border-2 border-border/30 hover:border-primary/30'}`}>
                                                                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 border-border/40 bg-card p-0.5">
                                                                        {pieza.imagenes?.[0] ? (
                                                                            <img src={pieza.imagenes[0]} className="w-full h-full object-cover rounded-lg" />
                                                                        ) : <Package className="w-full h-full p-4 opacity-10" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="font-black text-sm uppercase tracking-tighter truncate italic">{pieza.nombre}</p>
                                                                            {piezaBad && <AlertTriangle size={14} className="text-destructive" />}
                                                                        </div>
                                                                        <div className="text-[9px] font-black uppercase tracking-widest flex gap-3">
                                                                            {piezaBad ? (
                                                                                <span className="text-destructive">DAÑADO</span>
                                                                            ) : (
                                                                                <>
                                                                                    <span className="text-muted-foreground">TOTAL: {pieza.cantidad}</span>
                                                                                    <span className={avail > 0 ? 'text-green-500' : 'text-destructive'}>LIBRES: {avail}</span>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {!piezaBad && avail > 0 && (
                                                                        <button
                                                                            onClick={() => addToCart("Pieza", pieza)}
                                                                            className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                                                                        >
                                                                            <Plus size={20} strokeWidth={3} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BUTTON */}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-5">
                {cart.length > 0 && (
                    <div className="bg-background/95 backdrop-blur-2xl border-2 border-primary/30 p-4 rounded-3xl shadow-2xl animate-in slide-in-from-right-10 flex items-center gap-4 group cursor-pointer" onClick={() => setIsCartOpen(true)}>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Pre-selección</p>
                            <p className="text-sm font-black italic">{cart.length} Elementos agregados</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="group bg-primary text-white w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(var(--primary),0.5)] hover:shadow-primary/60 hover:-translate-y-2 active:scale-95 transition-all flex items-center justify-center relative ring-8 ring-primary/5"
                >
                    <ShoppingCart size={32} strokeWidth={3} className="group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500" />
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-8 h-8 bg-destructive text-white text-[12px] font-black rounded-full flex items-center justify-center border-4 border-primary shadow-xl">
                            {cart.length}
                        </span>
                    )}
                </button>
            </div>

            {/* FULL TWO-COLUMN MODAL REDESIGN */}
            <div
                className={`fixed inset-0 z-[110] transition-all duration-500 flex items-center justify-center p-0 md:p-8 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="absolute inset-0 bg-background/40 backdrop-blur-2xl"
                    onClick={() => setIsCartOpen(false)}
                />

                <div
                    className={`relative w-full h-full md:max-w-7xl md:h-[90vh] md:max-h-[850px] bg-card border-2 border-border/40 md:rounded-[3rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-700 flex flex-col ${isCartOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-20'}`}
                >
                    {/* Modal Fixed Header */}
                    <div className="p-6 md:p-10 border-b border-border/40 flex items-center justify-between bg-muted/5 shrink-0">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
                                <ShoppingCart size={28} strokeWidth={3} />
                            </div>
                            <div className="space-y-0.5">
                                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Confirmar Préstamo</h2>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 opacity-60">
                                    Finaliza los detalles para emitir el comprobante
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(false)}
                            className="w-12 h-12 bg-muted/50 hover:bg-destructive hover:text-white rounded-xl transition-all flex items-center justify-center"
                        >
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Modal Content - Scrollable Columns */}
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                        {/* LEFT: Items Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-muted/5 custom-scrollbar border-r border-border/40">
                            <div className="flex items-center justify-between sticky top-0 bg-card/60 backdrop-blur-md z-10 py-2 -mt-2">
                                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                                    <Package size={16} className="text-primary" /> Equipos & Piezas Seleccionadas
                                </h3>
                                <p className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-lg uppercase">
                                    {cart.length} Elementos
                                </p>
                            </div>

                            {cart.length > 0 ? (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="group flex gap-4 items-center bg-card border-2 border-border/40 p-4 rounded-[1.75rem] hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                                            <div className="w-16 h-16 rounded-xl border-2 border-border/40 overflow-hidden shrink-0 p-0.5">
                                                {item.imagen ? (
                                                    <img src={item.imagen} className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20 bg-muted/50">
                                                        <Package size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{item.codigo || item.tipo}</p>
                                                <p className="text-base font-black tracking-tight truncate uppercase italic leading-none">{item.nombre}</p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    <div className="flex items-center gap-1.5 bg-muted/80 rounded-xl p-1 px-2.5 border border-border/40">
                                                        <button onClick={() => updateCartQuantity(item.id, -1)} className="p-0.5 hover:text-primary transition-all"><Minus size={12} strokeWidth={3} /></button>
                                                        <span className="text-xs font-black min-w-[25px] text-center italic">{item.cantidad}</span>
                                                        <button onClick={() => updateCartQuantity(item.id, 1)} className="p-0.5 hover:text-primary transition-all"><Plus size={12} strokeWidth={3} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-destructive rounded-xl transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[200px] flex flex-col items-center justify-center text-center opacity-20 gap-4">
                                    <ShoppingCart size={60} strokeWidth={1} />
                                    <p className="text-[12px] font-black uppercase tracking-[0.3em]">Carrito Vacío</p>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: User Data & Sticky Footer */}
                        <div className="w-full lg:w-[450px] flex flex-col bg-background/30 shrink-0">

                            {/* Scrollable Form Area */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
                                <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                                    <User size={16} className="text-primary" /> Datos de Registro
                                </h3>

                                <div className="space-y-8">
                                    {/* Receptor Section */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 italic">
                                            Receptor del Material
                                        </label>

                                        {selectedUser ? (
                                            <div className="group relative p-5 bg-card border-2 border-primary/40 rounded-[1.75rem] shadow-2xl shadow-primary/5 animate-in zoom-in-95 duration-500">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-lg font-black italic uppercase leading-none truncate text-primary">{selectedUser.nombres} {selectedUser.apellidop}</p>
                                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">{selectedUser.tipo} • ID: {selectedUser.id}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedUser(null)}
                                                        className="w-9 h-9 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl transition-all flex items-center justify-center shrink-0"
                                                    >
                                                        <X size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
                                                    {["Estudiante", "Externo"].map((t) => (
                                                        <button
                                                            key={t}
                                                            onClick={() => setUserType(t as any)}
                                                            className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${userType === t ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' : 'text-muted-foreground hover:text-foreground opacity-60'}`}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="relative group">
                                                    <input
                                                        type="text"
                                                        placeholder={`Ingresar ID o nombre...`}
                                                        className="w-full h-12 pl-4 pr-24 bg-muted/40 border-2 border-border/40 rounded-xl font-black uppercase text-xs focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                                        value={userQuery}
                                                        onChange={(e) => setUserQuery(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                                                    />
                                                    <button
                                                        onClick={handleSearchUser}
                                                        disabled={isSearchingUser}
                                                        className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-foreground text-background hover:bg-primary hover:text-white rounded-lg font-black text-[9px] uppercase tracking-widest transition-all"
                                                    >
                                                        {isSearchingUser ? '...' : 'Buscar'}
                                                    </button>
                                                </div>
                                                {userResults.length > 0 && (
                                                    <div className="bg-card border-2 border-primary/20 rounded-2xl overflow-hidden divide-y divide-border/40 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                                                        <div className="p-3 bg-primary/5 text-[8px] font-black uppercase text-primary tracking-widest text-center border-b border-border/40">
                                                            ⬇️ Haz click abajo para seleccionar ⬇️
                                                        </div>
                                                        {userResults.map(u => (
                                                            <button
                                                                key={u.id}
                                                                onClick={() => { setSelectedUser(u); setUserResults([]); setUserQuery(""); }}
                                                                className="w-full p-4 text-left hover:bg-primary hover:text-white transition-all flex justify-between items-center group/u"
                                                            >
                                                                <div className="space-y-0.5">
                                                                    <p className="text-[13px] font-black italic uppercase group-hover/u:translate-x-1 transition-transform leading-tight">{u.nombres} {u.apellidop}</p>
                                                                    <p className="text-[8px] font-black opacity-60 uppercase tracking-widest">{u.tipo} • {u.id}</p>
                                                                </div>
                                                                <Check size={16} className="opacity-0 group-hover/u:opacity-100 transition-all" strokeWidth={4} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Date Section */}
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 italic">
                                            Fecha de Devolución
                                        </label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" size={18} />
                                            <input
                                                type="date"
                                                className="w-full h-12 pl-12 pr-4 bg-muted/40 border-2 border-border/40 rounded-xl font-black text-xs uppercase focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all outline-none cursor-pointer"
                                                value={returnDate}
                                                onChange={(e) => setReturnDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Fixed Footer - Button always visible */}
                            <div className="p-6 md:p-10 border-t border-border/40 bg-muted/5 space-y-6 shrink-0">

                                {/* CONFIRMATION CHECKBOX */}
                                <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${isConfirmed ? 'bg-primary/5 border-primary/30' : 'bg-destructive/5 border-destructive/20 hover:border-destructive/40'}`} onClick={() => setIsConfirmed(!isConfirmed)}>
                                    <div className={`w-6 h-6 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${isConfirmed ? 'bg-primary border-primary text-white' : 'bg-transparent border-destructive/40'}`}>
                                        {isConfirmed && <Check size={14} strokeWidth={4} />}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest italic leading-tight">Confirmación de Datos</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase leading-tight opacity-70">He verificado el material y la identidad del receptor</p>
                                    </div>
                                </div>

                                <button
                                    className={`w-full h-16 rounded-2xl font-black italic uppercase text-base tracking-[0.15em] flex items-center justify-center gap-4 transition-all relative group overflow-hidden ${isSubmitting ? 'bg-muted cursor-not-allowed' : 'bg-primary text-white shadow-[0_25px_50px_-12px_rgba(var(--primary),0.6)] hover:shadow-primary/80 hover:-translate-y-1 active:scale-95'}`}
                                    onClick={handleFinalize}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Procesando...
                                        </span>
                                    ) : (
                                        <>
                                            Registrar Préstamo
                                            <CheckCircle2 size={20} strokeWidth={3} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary), 0.3);
                }
            `}</style>
        </div>
    );
}
