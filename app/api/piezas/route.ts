import { NextResponse } from "next/server";
import { PrismaPiezaRepository } from "@/infrastructure/repositories/PrismaPiezaRepository";
import { ImageService } from "@/infrastructure/services/ImageService";

const piezaRepo = new PrismaPiezaRepository();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const itemId = searchParams.get("itemId");

        if (itemId) {
            const piezas = await piezaRepo.findAllByItem(parseInt(itemId));
            return NextResponse.json(piezas);
        }

        const piezas = await piezaRepo.findAll();
        return NextResponse.json(piezas);
    } catch (error: any) {
        console.error("Error in GET /api/piezas:", error);
        return NextResponse.json({ error: "Error fetching pieces: " + error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const nombre = formData.get("nombre") as string;
        const cantidad = parseInt(formData.get("cantidad") as string);
        const observacion = formData.get("observacion") as string;
        const itemId = parseInt(formData.get("itemId") as string);

        const files = formData.getAll("imagenes") as File[];
        const imageUrls = await ImageService.saveImages(files);

        const newPieza = await piezaRepo.create({
            nombre,
            cantidad,
            observacion,
            itemId
        }, imageUrls);

        return NextResponse.json(newPieza, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/piezas:", error);
        return NextResponse.json({ error: "Error creating piece: " + error.message }, { status: 500 });
    }
}
