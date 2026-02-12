import prisma from "../db/prisma";
import { Pieza } from "../../domain/entities/Inventario";
import { IPiezaRepository } from "../../domain/repositories/IInventarioRepository";

export class PrismaPiezaRepository implements IPiezaRepository {
    async findAll(): Promise<Pieza[]> {
        const piezas = await prisma.pieza.findMany({
            include: { imagenes: true },
            orderBy: { createdAt: 'desc' }
        });
        return piezas.map(p => this.mapToDomain(p));
    }

    async findById(id: number): Promise<Pieza | null> {
        const pieza = await prisma.pieza.findUnique({
            where: { id },
            include: { imagenes: true }
        });
        return pieza ? this.mapToDomain(pieza) : null;
    }

    async findAllByItem(itemId: number): Promise<Pieza[]> {
        const piezas = await prisma.pieza.findMany({
            where: { itemId },
            include: { imagenes: true },
            orderBy: { createdAt: 'desc' }
        });
        return piezas.map(p => this.mapToDomain(p));
    }

    async create(data: Omit<Pieza, "id" | "createdAt">, imagenes?: string[]): Promise<Pieza> {
        const pieza = await prisma.pieza.create({
            data: {
                nombre: data.nombre,
                cantidad: data.cantidad,
                observacion: data.observacion,
                estado: data.estado || "Disponible",
                itemId: data.itemId,
                imagenes: imagenes ? {
                    create: imagenes.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(pieza);
    }

    async update(id: number, data: Partial<Omit<Pieza, "id" | "createdAt">>, imagenes?: string[]): Promise<Pieza> {
        if (imagenes) {
            await prisma.imagenPieza.deleteMany({
                where: { piezaId: id }
            });
        }

        const pieza = await prisma.pieza.update({
            where: { id },
            data: {
                nombre: data.nombre,
                cantidad: data.cantidad,
                observacion: data.observacion,
                estado: data.estado,
                itemId: data.itemId,
                imagenes: imagenes ? {
                    create: imagenes.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(pieza);
    }

    async delete(id: number): Promise<void> {
        await prisma.imagenPieza.deleteMany({
            where: { piezaId: id }
        });
        await prisma.pieza.delete({
            where: { id }
        });
    }

    private mapToDomain(p: any): Pieza {
        return new Pieza(
            p.id,
            p.nombre,
            p.cantidad,
            p.observacion,
            p.itemId,
            p.createdAt,
            p.estado,
            p.imagenes?.map((img: any) => img.url)
        );
    }
}
