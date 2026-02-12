import prisma from "../db/prisma";
import { Item } from "../../domain/entities/Inventario";
import { IItemRepository } from "../../domain/repositories/IInventarioRepository";

export class PrismaItemRepository implements IItemRepository {
    async findAll(): Promise<Item[]> {
        const items = await prisma.item.findMany({
            include: {
                imagenes: true,
                piezas: {
                    include: { imagenes: true, novedades: { include: { usuario: true } } }
                },
                novedades: { include: { usuario: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return items.map(i => this.mapToDomain(i));
    }

    async findById(id: number): Promise<Item | null> {
        const item = await prisma.item.findUnique({
            where: { id },
            include: {
                imagenes: true,
                piezas: {
                    include: { imagenes: true, novedades: { include: { usuario: true } } }
                },
                novedades: { include: { usuario: true } }
            }
        });
        return item ? this.mapToDomain(item) : null;
    }

    async findAllByTemplate(plantillaId: number): Promise<Item[]> {
        const items = await prisma.item.findMany({
            where: { plantillaId },
            include: { imagenes: true },
            orderBy: { createdAt: 'desc' }
        });
        return items.map(i => this.mapToDomain(i));
    }

    async countByTemplate(plantillaId: number): Promise<number> {
        return await prisma.item.count({
            where: { plantillaId }
        });
    }

    async create(data: Omit<Item, "id" | "createdAt">, imagenes?: string[]): Promise<Item> {
        const item = await prisma.item.create({
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                observacion: data.observacion,
                ubicacion: data.ubicacion,
                estado: data.estado,
                plantillaId: data.plantillaId,
                imagenes: imagenes ? {
                    create: imagenes.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(item);
    }

    async update(id: number, data: Partial<Omit<Item, "id" | "createdAt">>, newImages?: string[], imagesToDelete?: string[]): Promise<Item> {
        // Delete specific images if provided
        if (imagesToDelete && imagesToDelete.length > 0) {
            await prisma.imagenItem.deleteMany({
                where: {
                    itemId: id,
                    url: { in: imagesToDelete }
                }
            });
        }

        const item = await prisma.item.update({
            where: { id },
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                observacion: data.observacion,
                ubicacion: data.ubicacion,
                estado: data.estado,
                plantillaId: data.plantillaId,
                imagenes: newImages ? {
                    create: newImages.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(item);
    }

    async delete(id: number): Promise<void> {
        await prisma.imagenItem.deleteMany({
            where: { itemId: id }
        });
        await prisma.pieza.deleteMany({
            where: { itemId: id }
        });
        await prisma.item.delete({
            where: { id }
        });
    }

    private mapToDomain(i: any): Item {
        return new Item(
            i.id,
            i.codigo,
            i.descripcion,
            i.observacion,
            i.ubicacion,
            i.estado,
            i.plantillaId,
            i.createdAt,
            i.imagenes?.map((img: any) => img.url),
            i.piezas?.map((p: any) => ({
                ...p,
                imagenes: p.imagenes?.map((img: any) => img.url),
                novedades: p.novedades?.map((n: any) => ({
                    ...n,
                    usuarioNombre: n.usuario?.name || n.usuario?.email
                }))
            })),
            i.novedades?.map((n: any) => ({
                ...n,
                usuarioNombre: n.usuario?.name || n.usuario?.email
            }))
        );
    }
}
