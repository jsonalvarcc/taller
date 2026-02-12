import { NextResponse } from "next/server";
import { PrismaPlantillaItemRepository } from "@/infrastructure/repositories/PrismaPlantillaItemRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const plantillaRepo = new PrismaPlantillaItemRepository();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const plantilla = await plantillaRepo.findById(id);
        if (!plantilla) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }
        return NextResponse.json(plantilla);
    } catch (error) {
        return NextResponse.json({ error: "Error fetching template" }, { status: 500 });
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
        if (formData.has("fabricante")) data.fabricante = formData.get("fabricante");
        if (formData.has("modelo")) data.modelo = formData.get("modelo");
        if (formData.has("prefijo")) data.prefijo = formData.get("prefijo");
        if (formData.has("categoriaId")) data.categoriaId = parseInt(formData.get("categoriaId") as string);

        const files = formData.getAll("imagenes") as File[];
        let imageUrls: string[] | undefined = undefined;

        if (files.length > 0 && files[0].size > 0) {
            imageUrls = await ImageService.saveImages(files);
        }

        const updated = await plantillaRepo.update(id, data, imageUrls);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Error updating template" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await plantillaRepo.delete(id);
        return NextResponse.json({ message: "Template deleted" });
    } catch (error: any) {
        console.error("Error in DELETE /api/plantillas/[id]:", error);

        // Handle dependency errors with 400 status
        if (error.message?.includes("asociados")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: "Error deleting template" }, { status: 500 });
    }
}
