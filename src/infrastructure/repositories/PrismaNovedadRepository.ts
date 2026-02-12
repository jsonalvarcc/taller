import prisma from "../db/prisma";
import { Novedad } from "../../domain/entities/Inventario";

export class PrismaNovedadRepository {
    async create(data: {
        tipo: string;
        descripcion: string;
        itemId: number;
        userId: string;
        itemNuevoEstado?: string;
        detalles?: { piezaId: number; cantidad?: number; nuevoEstado?: string }[];
    }): Promise<Novedad> {
        const novedad = await prisma.novedad.create({
            data: {
                tipo: data.tipo,
                descripcion: data.descripcion,
                itemNuevoEstado: data.itemNuevoEstado,
                itemId: data.itemId,
                userId: data.userId,
                detalles: data.detalles ? {
                    create: data.detalles.map(d => ({
                        piezaId: d.piezaId,
                        cantidad: d.cantidad,
                        nuevoEstado: d.nuevoEstado
                    }))
                } : undefined
            },
            include: {
                usuario: true,
                detalles: { include: { pieza: true } }
            }
        });

        return this.mapToDomain(novedad);
    }

    async findByItem(itemId: number): Promise<Novedad[]> {
        const novedades = await prisma.novedad.findMany({
            where: { itemId },
            include: {
                usuario: true,
                detalles: { include: { pieza: true } }
            },
            orderBy: { fecha: 'desc' }
        });
        return novedades.map(n => this.mapToDomain(n));
    }

    private mapToDomain(n: any): Novedad {
        return new Novedad(
            n.id,
            n.tipo,
            n.descripcion,
            n.fecha,
            n.itemId,
            n.userId,
            n.itemNuevoEstado,
            n.usuario?.name || n.usuario?.email,
            n.detalles?.map((d: any) => ({
                id: d.id,
                novedadId: d.novedadId,
                piezaId: d.piezaId,
                cantidad: d.cantidad,
                nuevoEstado: d.nuevoEstado,
                piezaNombre: d.pieza?.nombre
            }))
        );
    }
}
