import { NextResponse } from "next/server";
import { PrismaCategoriaRepository } from "@/infrastructure/repositories/PrismaCategoriaRepository";

const categoriaRepo = new PrismaCategoriaRepository();

export async function GET() {
    try {
        const categorias = await categoriaRepo.findAll();
        return NextResponse.json(categorias);
    } catch (error: any) {
        console.error("Error in GET /api/categorias:", error);
        return NextResponse.json({ error: "Error fetching categories: " + error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const data = await req.json();
        if (!data.nombre || !data.prefijo) {
            return NextResponse.json({ error: "Nombre and prefijo are required" }, { status: 400 });
        }
        const newCategoria = await categoriaRepo.create(data);
        return NextResponse.json(newCategoria, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/categorias:", error);
        return NextResponse.json({ error: "Error creating category: " + error.message }, { status: 500 });
    }
}
