import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { UpdateUserUseCase } from "@/application/use-cases/UpdateUser";
import { DeleteUserUseCase } from "@/application/use-cases/DeleteUser";

const userRepository = new PrismaUserRepository();

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const updateUser = new UpdateUserUseCase(userRepository);
        const user = await updateUser.execute(id, body);
        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleteUser = new DeleteUserUseCase(userRepository);
        await deleteUser.execute(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
