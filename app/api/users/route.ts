import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { GetAllUsersUseCase } from "@/application/use-cases/GetAllUsers";
import { RegisterUserUseCase } from "@/application/use-cases/RegisterUser";

const userRepository = new PrismaUserRepository();

export async function GET() {
    try {
        const getAllUsers = new GetAllUsersUseCase(userRepository);
        const users = await getAllUsers.execute();
        return NextResponse.json(users);
    } catch (error) {
        console.error("Error in GET /api/users:", error);
        return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    console.log("POST /api/users: Inicio");
    try {
        const body = await req.json();
        console.log("POST /api/users: Body recibido:", body);
        const registerUser = new RegisterUserUseCase(userRepository);
        const user = await registerUser.execute(body);
        console.log("POST /api/users: Usuario registrado con éxito");
        return NextResponse.json(user, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/users: ERROR:", error.message);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
