import prisma from "../db/prisma";
import { Novedad, DetalleNovedadPieza } from "../../domain/entities/Inventario";

export class PrismaNovedadRepository {
    async create(data: {
        tipo: string;
        descripcion: string;
        itemId: number;
        userId: string;
        itemNuevoEstado?: string;
        detalles?: { piezaId: number; cantidad?: number; nuevoEstado?: string; descripcion?: string }[];
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
                        nuevoEstado: d.nuevoEstado,
                        descripcion: d.descripcion
                    }))
                } : undefined
            },
            include: {
                usuario: true,
                item: { include: { imagenes: true } },
                detalles: { include: { pieza: { include: { imagenes: true } } } }
            }
        });

        return this.mapToDomain(novedad);
    }

    async findByItem(itemId: number): Promise<Novedad[]> {
        const novedades = await prisma.novedad.findMany({
            where: { itemId },
            include: {
                usuario: true,
                item: { include: { imagenes: true } },
                detalles: { include: { pieza: { include: { imagenes: true } } } }
            },
            orderBy: { fecha: 'desc' }
        });
        return novedades.map(n => this.mapToDomain(n));
    }

    async findAll(): Promise<Novedad[]> {
        const novedades = await prisma.novedad.findMany({
            include: {
                usuario: true,
                item: { include: { imagenes: true } },
                detalles: { include: { pieza: { include: { imagenes: true } } } }
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
            n.detalles?.map((d: any) => new DetalleNovedadPieza(
                d.id,
                d.novedadId,
                d.piezaId,
                d.cantidad,
                d.nuevoEstado,
                d.descripcion,
                d.pieza?.nombre,
                d.pieza?.imagenes?.map((img: any) => img.url)
            )),
            n.item?.codigo,
            n.item?.imagenes?.map((img: any) => img.url)
        );
    }
}
