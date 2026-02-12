import { NextResponse } from "next/server";
import { PrismaItemRepository } from "@/infrastructure/repositories/PrismaItemRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const itemRepo = new PrismaItemRepository();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const plantillaId = searchParams.get("plantillaId");

        if (plantillaId) {
            const count = await itemRepo.countByTemplate(parseInt(plantillaId));
            return NextResponse.json({ count });
        }

        const items = await itemRepo.findAll();
        return NextResponse.json(items);
    } catch (error: any) {
        console.error("Error in GET /api/items:", error);
        return NextResponse.json({ error: "Error fetching items: " + error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const codigo = formData.get("codigo") as string;
        const descripcion = formData.get("descripcion") as string;
        const observacion = formData.get("observacion") as string;
        const ubicacion = formData.get("ubicacion") as string;
        const estado = formData.get("estado") as string;
        const plantillaId = parseInt(formData.get("plantillaId") as string);

        const files = formData.getAll("imagenes") as File[];
        const imageUrls = await ImageService.saveImages(files);

        const newItem = await itemRepo.create({
            codigo,
            descripcion,
            observacion,
            ubicacion,
            estado,
            plantillaId
        }, imageUrls);

        return NextResponse.json(newItem, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/items:", error);
        return NextResponse.json({ error: "Error creating item: " + error.message }, { status: 500 });
    }
}
