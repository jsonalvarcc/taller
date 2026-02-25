"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Box,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  History,
  User,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Package,
  Loader2,
} from "lucide-react";

interface Item {
  id: number;
  codigo: string;
  descripcion: string;
  observacion: string;
  ubicacion: string;
  estado: string;
  imagenes?: string[];
  piezas?: Pieza[];
}

interface Pieza {
  id: number;
  nombre: string;
  cantidad: number;
  estado: string;
  imagenes?: string[];
}

// ... (interfaces remain largely the same, but we add new ones for state)
interface NovedadInfo {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  usuarioNombre: string;
  detalles?: { piezaNombre: string; cantidad: number; nuevoEstado: string }[];
}

export default function QuickReportPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<NovedadInfo[]>([]);
  const [form, setForm] = useState({
    tipo: "Dañado",
    descripcion: "",
    itemNuevoEstado: "",
    piezasAfectadas: [] as {
      piezaId: number;
      nombre: string;
      cantidad: number;
      nuevoEstado: string;
      descripcion: string;
    }[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setIsLoading(false);
      })
      .catch((err) => console.error("Error fetching items:", err));
  }, []);

  useEffect(() => {
    if (selectedItem) {
      fetch(`/api/novedades?itemId=${selectedItem.id}`)
        .then((res) => res.json())
        .then((data) => setHistory(data))
        .catch((err) => console.error("Error fetching history:", err));
    }
  }, [selectedItem]);

  const filteredResults = useMemo(() => {
    if (!search.trim()) return [];
    const query = search.toLowerCase();
    return items
      .filter(
        (item) =>
          item.codigo.toLowerCase().includes(query) ||
          item.descripcion.toLowerCase().includes(query),
      )
      .slice(0, 10);
  }, [search, items]);

  const handleTogglePieza = (pieza: Pieza) => {
    const exists = form.piezasAfectadas.find((p) => p.piezaId === pieza.id);
    if (exists) {
      setForm({
        ...form,
        piezasAfectadas: form.piezasAfectadas.filter(
          (p) => p.piezaId !== pieza.id,
        ),
      });
    } else {
      setForm({
        ...form,
        piezasAfectadas: [
          ...form.piezasAfectadas,
          {
            piezaId: pieza.id,
            nombre: pieza.nombre,
            cantidad: 1,
            nuevoEstado: pieza.estado || "Disponible",
            descripcion: "",
          },
        ],
      });
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/novedades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: form.tipo,
          descripcion: form.descripcion,
          itemId: selectedItem.id,
          itemNuevoEstado: form.itemNuevoEstado || undefined,
          detalles: form.piezasAfectadas.map((p) => ({
            piezaId: p.piezaId,
            cantidad: p.cantidad,
            nuevoEstado: p.nuevoEstado,
            descripcion: p.descripcion,
          })),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSelectedItem(null);
          setForm({
            tipo: "Dañado",
            descripcion: "",
            itemNuevoEstado: "",
            piezasAfectadas: [],
          });
          setSearch("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error reporting:", error);
      alert("Error al enviar el reporte");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full text-xs font-black uppercase tracking-widest border border-amber-500/20">
            <AlertTriangle size={14} />
            Centro de Reportes Maestros
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tight">
            Reportar <span className="text-primary italic">Incidencias</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Busca un activo para registrar incidencias detalladas en el item
            principal y sus piezas.
          </p>
        </div>

        {!selectedItem ? (
          <div className="space-y-6 max-w-3xl">
            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search size={24} />
              </div>
              <input
                type="text"
                placeholder="Busca por código o descripción del activo..."
                className="w-full h-24 bg-card border-2 border-border/50 rounded-[2.5rem] pl-20 pr-8 text-2xl font-bold placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-2xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    setSelectedItem(res);
                    setForm((prev) => ({
                      ...prev,
                      itemNuevoEstado: res.estado || "Disponible",
                    }));
                  }}
                  className="flex items-center gap-4 p-6 bg-card border border-border/50 rounded-[2rem] text-left hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl transition-all duration-300 group"
                >
                  <div
                    className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border/50 shrink-0 relative"
                    onMouseEnter={() =>
                      setHoveredImage(res.imagenes?.[0] || null)
                    }
                    onMouseMove={(e) =>
                      setMousePos({ x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setHoveredImage(null)}
                  >
                    {res.imagenes && res.imagenes.length > 0 ? (
                      <img
                        src={res.imagenes[0]}
                        alt={res.codigo}
                        className="w-full h-full object-cover transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/30">
                        <Box size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">
                      Activo
                    </p>
                    <p className="text-base font-bold text-foreground truncate">
                      {res.codigo}
                    </p>
                    <p className="text-xs text-muted-foreground truncate italic">
                      {res.descripcion}
                    </p>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* History / Info Column */}
            <div className="space-y-6">
              <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
                    Información
                  </h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Cambiar
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedItem.imagenes &&
                    selectedItem.imagenes.length > 0 && (
                      <div
                        className="aspect-square rounded-3xl overflow-hidden border border-border/50 shadow-inner cursor-crosshair"
                        onMouseEnter={() =>
                          setHoveredImage(selectedItem.imagenes?.[0] || null)
                        }
                        onMouseMove={(e) =>
                          setMousePos({ x: e.clientX, y: e.clientY })
                        }
                        onMouseLeave={() => setHoveredImage(null)}
                      >
                        <img
                          src={selectedItem.imagenes[0]}
                          alt={selectedItem.codigo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  <div className="p-4 bg-muted/30 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Código
                    </p>
                    <p className="text-xl font-black text-foreground">
                      {selectedItem.codigo}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Estado Actual
                    </p>
                    <p className="text-sm font-bold text-primary italic">
                      {selectedItem.estado || "Disponible"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-6">
                <h3 className="text-lg font-black uppercase tracking-widest text-foreground">
                  Historial Reciente
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.length > 0 ? (
                    history.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 bg-muted/20 border-l-4 border-primary rounded-r-2xl space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-primary uppercase">
                            {h.tipo}
                          </span>
                          <span className="text-[8px] font-bold text-muted-foreground">
                            {new Date(h.fecha).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-foreground line-clamp-2">
                          {h.descripcion}
                        </p>
                        {h.detalles && h.detalles.length > 0 && (
                          <p className="text-[9px] font-black text-muted-foreground">
                            Afectó a {h.detalles.length} piezas
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-8">
                      Sin incidencias previas registradas.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-2">
              {success ? (
                <div className="bg-card border border-green-500/20 rounded-[3rem] p-12 text-center space-y-6 shadow-2xl h-full flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                    <CheckCircle2 size={48} className="text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-foreground">
                      ¡Reporte Maestro Enviado!
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      Las novedades han sido registradas y los estados
                      actualizados.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleReport}
                  className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-2xl"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                        Tipo de Suceso
                      </label>
                      <select
                        className="w-full h-16 bg-muted/40 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-4 focus:ring-primary/10 transition-all"
                        value={form.tipo}
                        onChange={(e) =>
                          setForm({ ...form, tipo: e.target.value })
                        }
                      >
                        {[
                          "Dañado",
                          "Perdido",
                          "Mantenimiento",
                          "Falla",
                          "Desgaste",
                          "Nota",
                        ].map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                        Nuevo Estado del Item
                      </label>
                      <select
                        className="w-full h-16 bg-primary/5 border-2 border-primary/20 rounded-2xl px-6 font-black text-primary transition-all"
                        value={form.itemNuevoEstado}
                        onChange={(e) =>
                          setForm({ ...form, itemNuevoEstado: e.target.value })
                        }
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="En Uso">En Uso</option>
                        <option value="Reparación">Reparación</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                      Descripción General del Suceso
                    </label>
                    <textarea
                      className="w-full min-h-[120px] bg-muted/30 border-none rounded-[2rem] p-8 text-base font-medium placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner"
                      placeholder="¿Qué sucedió con este activo?"
                      value={form.descripcion}
                      onChange={(e) =>
                        setForm({ ...form, descripcion: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">
                      Piezas Afectadas
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedItem.piezas?.map((pieza) => {
                        const isSelected = form.piezasAfectadas.find(
                          (p) => p.piezaId === pieza.id,
                        );
                        return (
                          <div
                            key={pieza.id}
                            className={`p-6 rounded-3xl border-2 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border/30 bg-muted/10"}`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={() => handleTogglePieza(pieza)}
                                  className="w-6 h-6 rounded-lg accent-primary cursor-pointer"
                                />
                                <div
                                  className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border/20 shrink-0 relative"
                                  onMouseEnter={() =>
                                    setHoveredImage(pieza.imagenes?.[0] || null)
                                  }
                                  onMouseMove={(e) =>
                                    setMousePos({ x: e.clientX, y: e.clientY })
                                  }
                                  onMouseLeave={() => setHoveredImage(null)}
                                >
                                  {pieza.imagenes &&
                                  pieza.imagenes.length > 0 ? (
                                    <img
                                      src={pieza.imagenes[0]}
                                      alt={pieza.nombre}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                      <Package size={20} />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-foreground text-sm uppercase">
                                    {pieza.nombre}
                                  </p>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                    Stock: {pieza.cantidad} |{" "}
                                    {pieza.estado || "Disponible"}
                                  </p>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                                  <div className="flex gap-4 items-center">
                                    <div className="w-20">
                                      <input
                                        type="number"
                                        value={isSelected.cantidad}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value);
                                          setForm({
                                            ...form,
                                            piezasAfectadas:
                                              form.piezasAfectadas.map((pa) =>
                                                pa.piezaId === pieza.id
                                                  ? { ...pa, cantidad: val }
                                                  : pa,
                                              ),
                                          });
                                        }}
                                        className="w-full h-10 bg-card border-border border rounded-xl px-2 text-center font-bold text-sm"
                                        min="1"
                                        max={pieza.cantidad}
                                      />
                                    </div>
                                    <select
                                      value={isSelected.nuevoEstado}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setForm({
                                          ...form,
                                          piezasAfectadas:
                                            form.piezasAfectadas.map((pa) =>
                                              pa.piezaId === pieza.id
                                                ? { ...pa, nuevoEstado: val }
                                                : pa,
                                            ),
                                        });
                                      }}
                                      className="h-10 bg-card border-border border rounded-xl px-3 font-bold text-[10px] uppercase"
                                    >
                                      <option value="Disponible">
                                        Disponible
                                      </option>
                                      <option value="En Uso">En Uso</option>
                                      <option value="Reparación">
                                        Reparación
                                      </option>
                                      <option value="Baja">Baja</option>
                                    </select>
                                  </div>
                                  <textarea
                                    placeholder="Descripción específica para esta pieza..."
                                    value={isSelected.descripcion}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setForm({
                                        ...form,
                                        piezasAfectadas:
                                          form.piezasAfectadas.map((pa) =>
                                            pa.piezaId === pieza.id
                                              ? { ...pa, descripcion: val }
                                              : pa,
                                          ),
                                      });
                                    }}
                                    className="w-full h-20 bg-card border-border border rounded-xl p-3 text-xs font-medium resize-none shadow-inner"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedItem.piezas ||
                        selectedItem.piezas.length === 0) && (
                        <div className="p-8 border-2 border-dashed border-border/50 rounded-3xl text-center">
                          <p className="text-xs text-muted-foreground font-medium">
                            Este activo no tiene piezas registradas.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-20 bg-primary text-primary-foreground rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={24} />
                      )}
                      {isSubmitting
                        ? "Sincronizando..."
                        : "Registrar Reporte Maestro"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover Zoom Overlay */}
      {hoveredImage && (
        <div
          className="fixed z-[999] pointer-events-none w-[400px] h-[400px] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl bg-black animate-in zoom-in-50 duration-200"
          style={{
            left:
              mousePos.x + 20 + 400 > window.innerWidth
                ? mousePos.x - 420
                : mousePos.x + 20,
            top:
              mousePos.y + 20 + 400 > window.innerHeight
                ? mousePos.y - 420
                : mousePos.y + 20,
          }}
        >
          <img
            src={hoveredImage}
            alt="Zoom"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
