import { NextResponse } from "next/server";
import { PrismaPlantillaItemRepository } from "@/infrastructure/repositories/PrismaPlantillaItemRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const plantillaRepo = new PrismaPlantillaItemRepository();

export async function GET() {
    try {
        const plantillas = await plantillaRepo.findAll();
        return NextResponse.json(plantillas);
    } catch (error: any) {
        console.error("Error in GET /api/plantillas:", error);
        return NextResponse.json({ error: "Error fetching templates: " + error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const nombre = formData.get("nombre") as string;
        const fabricante = formData.get("fabricante") as string;
        const modelo = formData.get("modelo") as string;
        const prefijo = formData.get("prefijo") as string;
        const categoriaId = parseInt(formData.get("categoriaId") as string);

        const files = formData.getAll("imagenes") as File[];
        const imageUrls = await ImageService.saveImages(files);

        const newPlantilla = await plantillaRepo.create({
            nombre,
            fabricante,
            modelo,
            prefijo,
            categoriaId
        }, imageUrls);

        return NextResponse.json(newPlantilla, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/plantillas:", error);
        return NextResponse.json({ error: "Error creating template: " + error.message }, { status: 500 });
    }
}
