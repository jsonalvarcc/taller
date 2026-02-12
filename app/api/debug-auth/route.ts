import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import prisma from "@/infrastructure/db/prisma";

export async function GET() {
    try {
        const session = await auth();
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true }
        });

        return NextResponse.json({
            session: {
                user: session?.user,
                expires: session?.expires
            },
            databaseUsers: users,
            match: users.some(u => u.id === session?.user?.id)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
