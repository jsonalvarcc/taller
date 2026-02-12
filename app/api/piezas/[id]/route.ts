import { NextResponse } from "next/server";
import { PrismaPiezaRepository } from "@/infrastructure/repositories/PrismaPiezaRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const piezaRepo = new PrismaPiezaRepository();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const pieza = await piezaRepo.findById(id);
        if (!pieza) {
            return NextResponse.json({ error: "Piece not found" }, { status: 404 });
        }
        return NextResponse.json(pieza);
    } catch (error: any) {
        console.error("Error in GET /api/piezas/[id]:", error);
        return NextResponse.json({ error: "Error fetching piece: " + error.message }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const formData = await req.formData();

        const data: any = {};
        if (formData.has("nombre")) data.nombre = formData.get("nombre");
        if (formData.has("cantidad")) data.cantidad = parseInt(formData.get("cantidad") as string);
        if (formData.has("observacion")) data.observacion = formData.get("observacion");
        if (formData.has("itemId")) data.itemId = parseInt(formData.get("itemId") as string);

        const files = formData.getAll("imagenes") as File[];
        let imageUrls: string[] | undefined;
        if (files.length > 0 && files[0].size > 0) {
            imageUrls = await ImageService.saveImages(files);
        }

        const updated = await piezaRepo.update(id, data, imageUrls);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error in PUT /api/piezas/[id]:", error);
        return NextResponse.json({ error: "Error updating piece: " + error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await piezaRepo.delete(id);
        return NextResponse.json({ message: "Piece deleted" });
    } catch (error: any) {
        console.error("Error in DELETE /api/piezas/[id]:", error);
        return NextResponse.json({ error: "Error deleting piece: " + error.message }, { status: 500 });
    }
}
