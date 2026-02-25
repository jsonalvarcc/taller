import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import { PrismaPrestamoRepository } from "@/infrastructure/repositories/PrismaPrestamoRepository";
import { PrismaNovedadRepository } from "@/infrastructure/repositories/PrismaNovedadRepository";

const prestamoRepo = new PrismaPrestamoRepository();
const novedadRepo = new PrismaNovedadRepository();

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const prestamoId = parseInt(id);
        const body = await req.json();
        const { detallesDevueltos } = body; // { detalleId, estadoDevolucion, observacionDevolucion, itemId, piezaId }[]

        if (!detallesDevueltos || !Array.isArray(detallesDevueltos)) {
            return NextResponse.json({ error: "Datos de devolución invalidos" }, { status: 400 });
        }

        // Process return in repository
        const updatedPrestamo = await prestamoRepo.processReturn(prestamoId, session.user.id, detallesDevueltos);

        // Create damage reports for any item/piece that returned damaged
        for (const d of detallesDevueltos) {
            if (d.estadoDevolucion && d.estadoDevolucion !== "Disponible" && d.estadoDevolucion !== "OK") {
                await novedadRepo.create({
                    tipo: d.estadoDevolucion, // e.g., "Dañado", "Falla"
                    descripcion: `Reportado durante devolución de préstamo: ${d.observacionDevolucion || "Sin descripción adicional"}`,
                    itemId: d.itemId,
                    userId: session.user.id,
                    detalles: d.piezaId ? [{
                        piezaId: d.piezaId,
                        cantidad: d.cantidad || 1,
                        nuevoEstado: d.estadoDevolucion,
                        descripcion: `Dañado durante el préstamo`
                    }] : undefined
                });
            }
        }

        return NextResponse.json(updatedPrestamo);
    } catch (error: any) {
        console.error("Error in POST /api/prestamos/[id]/devolucion:", error);
        return NextResponse.json({ error: "Error al procesar devolución: " + error.message }, { status: 500 });
    }
}
