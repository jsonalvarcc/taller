"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Calendar,
  Box,
  Package,
  AlertCircle,
  Filter,
  ChevronDown,
  ArrowUpDown,
  User as UserIcon,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  X,
} from "lucide-react";

interface Detalle {
  id: number;
  piezaNombre: string;
  cantidad: number;
  nuevoEstado: string;
  descripcion: string;
  piezaImagenes?: string[];
}

interface Novedad {
  id: number;
  tipo: string;
  descripcion: string;
  fecha: string;
  itemCodigo: string;
  itemImagenes?: string[];
  itemNuevoEstado: string | null;
  usuarioNombre: string;
  detalles: Detalle[];
}

export default function HistorialPage() {
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [selectedNovedad, setSelectedNovedad] = useState<Novedad | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/novedades")
      .then((res) => res.json())
      .then((data) => {
        setNovedades(data);
        setIsLoading(false);
      })
      .catch((err) => console.error("Error fetching novelties:", err));
  }, []);

  const filteredNovedades = useMemo(() => {
    return novedades
      .filter((n) => {
        const matchesSearch =
          n.itemCodigo.toLowerCase().includes(search.toLowerCase()) ||
          n.descripcion.toLowerCase().includes(search.toLowerCase()) ||
          n.usuarioNombre.toLowerCase().includes(search.toLowerCase());
        const matchesTipo = filterTipo === "Todos" || n.tipo === filterTipo;
        return matchesSearch && matchesTipo;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [novedades, search, filterTipo, sortOrder]);

  const getStatusColor = (tipo: string) => {
    switch (tipo) {
      case "Dañado":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "Perdido":
        return "bg-zinc-500/10 text-zinc-600 border-zinc-500/20";
      case "Mantenimiento":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "Falla":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Nota":
        return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
      default:
        return "bg-green-500/10 text-green-600 border-green-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 lg:p-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
            <History size={14} />
            Historial de Operaciones
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tight">
            Reportes <span className="text-primary italic">Detallados</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium">
            Cronología completa de incidencias, daños y cambios de estado en el
            inventario.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por item, descripción..."
              className="h-14 pl-12 pr-6 bg-card border border-border/50 rounded-2xl w-64 lg:w-80 font-bold text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="h-14 pl-6 pr-12 bg-card border border-border/50 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="Todos">Todos los tipos</option>
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
            <Filter
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              size={16}
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="h-14 w-14 flex items-center justify-center bg-card border border-border/50 rounded-2xl hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          >
            <ArrowUpDown size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
          <History size={48} className="animate-spin duration-[3000ms]" />
          <p className="font-black uppercase tracking-widest text-xs">
            Cargando cronología...
          </p>
        </div>
      ) : filteredNovedades.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredNovedades.map((novedad) => (
            <div
              key={novedad.id}
              className="bg-card border border-border/50 rounded-[2.5rem] p-6 lg:p-8 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Item Thumbnail */}
                <div
                  className="w-full lg:w-32 aspect-square rounded-[2rem] overflow-hidden bg-muted border border-border/50 shrink-0 cursor-zoom-in group/img relative"
                  onMouseEnter={() =>
                    setHoveredImage(novedad.itemImagenes?.[0] || null)
                  }
                  onMouseMove={(e) =>
                    setMousePos({ x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setHoveredImage(null)}
                  onClick={() =>
                    novedad.itemImagenes?.[0] &&
                    setZoomedImage(novedad.itemImagenes[0])
                  }
                >
                  {novedad.itemImagenes && novedad.itemImagenes.length > 0 ? (
                    <img
                      src={novedad.itemImagenes[0]}
                      alt={novedad.itemCodigo}
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <Box size={32} />
                    </div>
                  )}
                </div>

                {/* Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(novedad.tipo)}`}
                      >
                        {novedad.tipo}
                      </span>
                      <div className="flex items-center gap-2 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                        <Calendar size={14} className="text-primary" />
                        {new Date(novedad.fecha).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNovedad(novedad)}
                      className="px-6 py-2 bg-primary/10 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary text-primary hover:text-white transition-all active:scale-95"
                    >
                      Ver Detalles Completos
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-foreground tracking-tight">
                        {novedad.itemCodigo}
                      </p>
                      {novedad.itemNuevoEstado && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-md text-[8px] font-black uppercase border border-amber-500/10">
                          Estado → {novedad.itemNuevoEstado}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground font-medium text-lg italic leading-relaxed">
                      "{novedad.descripcion}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 pt-2 border-t border-border/30">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase">
                        <UserIcon size={14} className="text-primary" />
                        {novedad.usuarioNombre}
                      </div>
                      {novedad.detalles.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase">
                          <AlertCircle size={14} className="text-primary" />
                          {novedad.detalles.length} pieza(s) afectada(s)
                        </div>
                      )}
                    </div>

                    {novedad.detalles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {novedad.detalles.slice(0, 3).map((d, i) => (
                          <div
                            key={i}
                            className="pl-1 pr-3 py-1 bg-muted rounded-xl text-[10px] font-bold text-muted-foreground border border-border/50 flex items-center gap-2 max-w-xs transition-all hover:bg-muted/80"
                          >
                            <div
                              className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-border/50 bg-background cursor-zoom-in relative"
                              onMouseEnter={() =>
                                setHoveredImage(d.piezaImagenes?.[0] || null)
                              }
                              onMouseMove={(e) =>
                                setMousePos({ x: e.clientX, y: e.clientY })
                              }
                              onMouseLeave={() => setHoveredImage(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                d.piezaImagenes?.[0] &&
                                  setZoomedImage(d.piezaImagenes[0]);
                              }}
                            >
                              {d.piezaImagenes && d.piezaImagenes.length > 0 ? (
                                <img
                                  src={d.piezaImagenes[0]}
                                  alt={d.piezaNombre}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                  <Package size={12} />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-primary uppercase truncate max-w-[100px]">
                                {d.piezaNombre}
                              </span>
                              {d.descripcion && (
                                <span className="italic truncate max-w-[100px]">
                                  "{d.descripcion}"
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {novedad.detalles.length > 3 && (
                          <div className="px-3 py-1 bg-muted rounded-lg text-[10px] font-bold text-muted-foreground border border-border/50 flex flex-col justify-center">
                            +{novedad.detalles.length - 3} más...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-96 bg-card border-2 border-dashed border-border/50 rounded-[3rem] flex flex-col items-center justify-center gap-6 text-center p-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-muted-foreground/20">
            <AlertTriangle size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">
              Sin reportes encontrados
            </h3>
            <p className="text-muted-foreground font-medium max-w-sm">
              No hay incidencias registradas que coincidan con tus criterios de
              búsqueda actual.
            </p>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedNovedad && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            onClick={() => setSelectedNovedad(null)}
          />
          <div className="relative bg-card border border-border w-full max-w-5xl h-full max-h-[90vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
            <div className="p-8 lg:p-12 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(selectedNovedad.tipo)}`}
                  >
                    {selectedNovedad.tipo}
                  </span>
                  <h2 className="text-3xl font-black text-foreground tracking-tight">
                    {selectedNovedad.itemCodigo}
                  </h2>
                </div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  {new Date(selectedNovedad.fecha).toLocaleString()} • Por{" "}
                  {selectedNovedad.usuarioNombre}
                </p>
              </div>
              <button
                onClick={() => setSelectedNovedad(null)}
                className="p-4 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-95"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
                  Descripción de la Incidencia
                </h3>
                <div className="p-8 bg-muted/20 rounded-[2rem] border border-border/30">
                  <p className="text-xl font-medium text-foreground italic leading-relaxed">
                    "{selectedNovedad.descripcion}"
                  </p>
                </div>
              </div>

              {selectedNovedad.detalles.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">
                    Piezas Afectadas Detalladamente
                  </h3>
                  <div className="grid grid-cols-1 gap-6">
                    {selectedNovedad.detalles.map((detalle) => (
                      <div
                        key={detalle.id}
                        className="p-8 bg-card border border-border/50 rounded-[2.5rem] flex flex-col md:flex-row gap-8 hover:border-primary/30 transition-all"
                      >
                        <div
                          className="w-full md:w-24 aspect-square rounded-[1.5rem] overflow-hidden bg-muted border border-border/50 shrink-0 cursor-zoom-in relative"
                          onMouseEnter={() =>
                            setHoveredImage(detalle.piezaImagenes?.[0] || null)
                          }
                          onMouseMove={(e) =>
                            setMousePos({ x: e.clientX, y: e.clientY })
                          }
                          onMouseLeave={() => setHoveredImage(null)}
                          onClick={() =>
                            detalle.piezaImagenes?.[0] &&
                            setZoomedImage(detalle.piezaImagenes[0])
                          }
                        >
                          {detalle.piezaImagenes &&
                          detalle.piezaImagenes.length > 0 ? (
                            <img
                              src={detalle.piezaImagenes[0]}
                              alt={detalle.piezaNombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <Package size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-lg font-black text-foreground uppercase tracking-tight">
                              {detalle.piezaNombre}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black uppercase">
                                Cant: {detalle.cantidad}
                              </div>
                              <div className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase">
                                → {detalle.nuevoEstado}
                              </div>
                            </div>
                          </div>
                          {detalle.descripcion ? (
                            <div className="p-4 bg-muted/30 rounded-2xl border-l-4 border-primary">
                              <p className="text-sm font-medium text-foreground italic">
                                "{detalle.descripcion}"
                              </p>
                            </div>
                          ) : (
                            <p className="text-[10px] font-bold text-muted-foreground italic px-4">
                              Sin descripción adicional para esta pieza.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zoom Lightbox */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
            <X size={32} />
          </button>
          <img
            src={zoomedImage}
            alt="Zoom"
            className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in-90 duration-300"
          />
        </div>
      )}

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
