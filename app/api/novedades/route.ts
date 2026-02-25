import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import { PrismaNovedadRepository } from "@/infrastructure/repositories/PrismaNovedadRepository";
import { PrismaItemRepository } from "@/infrastructure/repositories/PrismaItemRepository";
import { PrismaPiezaRepository } from "@/infrastructure/repositories/PrismaPiezaRepository";

const novedadRepo = new PrismaNovedadRepository();
const itemRepo = new PrismaItemRepository();
const piezaRepo = new PrismaPiezaRepository();

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { tipo, descripcion, itemId, itemNuevoEstado, detalles } = body;

        if (!tipo || !descripcion || !itemId) {
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        console.log("DEBUG: Session User:", JSON.stringify(session.user, null, 2));
        console.log("DEBUG: Creating novedad for userId:", session.user.id, "Type:", typeof session.user.id);
        const novedad = await novedadRepo.create({
            tipo,
            descripcion,
            itemId: parseInt(itemId),
            userId: session.user.id,
            itemNuevoEstado,
            detalles: detalles?.map((d: any) => ({
                piezaId: parseInt(d.piezaId),
                cantidad: d.cantidad ? parseInt(d.cantidad) : undefined,
                nuevoEstado: d.nuevoEstado,
                descripcion: d.descripcion
            }))
        });

        // Update states
        if (itemNuevoEstado) {
            await itemRepo.update(parseInt(itemId), { estado: itemNuevoEstado });
        }

        if (detalles && detalles.length > 0) {
            for (const d of detalles) {
                if (d.nuevoEstado) {
                    await piezaRepo.update(parseInt(d.piezaId), { estado: d.nuevoEstado });
                }
            }
        }

        return NextResponse.json(novedad, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/novedades:", error);
        return NextResponse.json({ error: "Error al registrar novedad: " + error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get("itemId");

        if (itemId) {
            const novedades = await novedadRepo.findByItem(parseInt(itemId));
            return NextResponse.json(novedades);
        }

        const novedades = await novedadRepo.findAll();
        return NextResponse.json(novedades);
    } catch (error: any) {
        console.error("Error in GET /api/novedades:", error);
        return NextResponse.json({ error: "Error al obtener novedades: " + error.message }, { status: 500 });
    }
}
