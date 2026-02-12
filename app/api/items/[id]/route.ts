import { NextResponse } from "next/server";
import { PrismaItemRepository } from "@/infrastructure/repositories/PrismaItemRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const itemRepo = new PrismaItemRepository();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const item = await itemRepo.findById(id);
        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }
        return NextResponse.json(item);
    } catch (error: any) {
        console.error("Error in GET /api/items/[id]:", error);
        return NextResponse.json({ error: "Error fetching item: " + error.message }, { status: 500 });
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
        if (formData.has("codigo")) data.codigo = formData.get("codigo");
        if (formData.has("descripcion")) data.descripcion = formData.get("descripcion");
        if (formData.has("observacion")) data.observacion = formData.get("observacion");
        if (formData.has("ubicacion")) data.ubicacion = formData.get("ubicacion");
        if (formData.has("estado")) data.estado = formData.get("estado");
        if (formData.has("plantillaId")) data.plantillaId = parseInt(formData.get("plantillaId") as string);

        const files = formData.getAll("imagenes") as File[];
        let imageUrls: string[] | undefined;
        if (files.length > 0 && files[0].size > 0) {
            imageUrls = await ImageService.saveImages(files);
        }

        // Get list of images to delete
        let imagesToDelete: string[] = [];
        if (formData.has("imagesToDelete")) {
            try {
                imagesToDelete = JSON.parse(formData.get("imagesToDelete") as string);
            } catch (e) {
                console.error("Error parsing imagesToDelete:", e);
            }
        }

        const updated = await itemRepo.update(id, data, imageUrls, imagesToDelete);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error in PUT /api/items/[id]:", error);
        return NextResponse.json({ error: "Error updating item: " + error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await itemRepo.delete(id);
        return NextResponse.json({ message: "Item deleted" });
    } catch (error: any) {
        console.error("Error in DELETE /api/items/[id]:", error);
        return NextResponse.json({ error: "Error deleting item: " + error.message }, { status: 500 });
    }
}
