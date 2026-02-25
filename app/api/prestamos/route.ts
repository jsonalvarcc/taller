import { NextResponse } from "next/server";
import { auth } from "@/infrastructure/auth/auth";
import { PrismaPrestamoRepository } from "@/infrastructure/repositories/PrismaPrestamoRepository";
import prisma from "@/infrastructure/db/prisma";

const prestamoRepo = new PrismaPrestamoRepository();

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        console.log("Creating loan with body:", body);
        console.log("Session user:", session.user);

        const {
            tipoUsuario,
            usuarioIdentificador,
            usuarioNombre,
            fechaEstimadaEntrega,
            detalles
        } = body;

        if (!tipoUsuario || !usuarioIdentificador || !usuarioNombre || !fechaEstimadaEntrega || !detalles) {
            console.error("Missing fields:", { tipoUsuario, usuarioIdentificador, usuarioNombre, fechaEstimadaEntrega, detalles });
            return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
        }

        // --- FIX: Verify if the User (Staff) exists in the database ---
        // This prevents P2003 if the session is stale or DB was reset.
        const userExists = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!userExists) {
            return NextResponse.json({
                error: "Tu sesión de usuario no es válida en la base de datos actual. Por favor, cierra sesión y vuelve a ingresar."
            }, { status: 403 });
        }

        const prestamo = await prestamoRepo.create({
            tipoUsuario,
            usuarioIdentificador,
            usuarioNombre,
            fechaEstimadaEntrega: new Date(fechaEstimadaEntrega),
            userIdSalida: session.user.id,
            detalles: detalles.map((d: any) => ({
                itemId: d.itemId ? Number(d.itemId) : undefined,
                piezaId: d.piezaId ? Number(d.piezaId) : undefined,
                cantidad: Number(d.cantidad)
            }))
        });

        console.log("Loan created successfully:", prestamo.id);
        return NextResponse.json(prestamo, { status: 201 });
    } catch (error: any) {
        console.error("Error in POST /api/prestamos:", error);
        return NextResponse.json({ error: "Error al registrar préstamo: " + error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const prestamos = await prestamoRepo.findAll();
        return NextResponse.json(prestamos);
    } catch (error: any) {
        console.error("Error in GET /api/prestamos:", error);
        return NextResponse.json({ error: "Error al obtener préstamos" }, { status: 500 });
    }
}
