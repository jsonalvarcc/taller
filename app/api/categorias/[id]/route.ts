import { NextResponse } from "next/server";
import { PrismaCategoriaRepository } from "@/infrastructure/repositories/PrismaCategoriaRepository";

const categoriaRepo = new PrismaCategoriaRepository();

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const categoria = await categoriaRepo.findById(id);
        if (!categoria) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        return NextResponse.json(categoria);
    } catch (error: any) {
        console.error("Error in GET /api/categorias/[id]:", error);
        return NextResponse.json({ error: "Error fetching category: " + error.message }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const data = await req.json();
        const updated = await categoriaRepo.update(id, data);
        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error in PUT /api/categorias/[id]:", error);
        return NextResponse.json({ error: "Error updating category: " + error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        await categoriaRepo.delete(id);
        return NextResponse.json({ message: "Category deleted" });
    } catch (error: any) {
        console.error("Error in DELETE /api/categorias/[id]:", error);

        // Handle dependency errors with 400 status
        if (error.message.includes("asociadas")) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ error: "Error deleting category: " + error.message }, { status: 500 });
    }
}
