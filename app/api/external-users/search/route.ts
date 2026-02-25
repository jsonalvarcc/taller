import { NextResponse } from "next/server";
import { ExternalUserService } from "@/infrastructure/services/ExternalUserService";

const externalService = new ExternalUserService();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const type = searchParams.get("type") || "Estudiante";

        if (!query) {
            return NextResponse.json({ error: "Consulta requerida" }, { status: 400 });
        }

        const users = await externalService.searchUser(query, type);
        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Error in external user search API:", error);
        return NextResponse.json({ error: "Error al buscar usuarios externos: " + error.message }, { status: 500 });
    }
}
