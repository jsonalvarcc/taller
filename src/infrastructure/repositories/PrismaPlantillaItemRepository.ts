import prisma from "../db/prisma";
import { PlantillaItem } from "../../domain/entities/Inventario";
import { IPlantillaItemRepository } from "../../domain/repositories/IInventarioRepository";

export class PrismaPlantillaItemRepository implements IPlantillaItemRepository {
    async findAll(): Promise<PlantillaItem[]> {
        const plantillas = await prisma.plantillaItem.findMany({
            include: { imagenes: true },
            orderBy: { createdAt: 'desc' }
        });
        return plantillas.map(p => this.mapToDomain(p));
    }

    async findById(id: number): Promise<PlantillaItem | null> {
        const plantilla = await prisma.plantillaItem.findUnique({
            where: { id },
            include: { imagenes: true }
        });
        return plantilla ? this.mapToDomain(plantilla) : null;
    }

    async create(data: Omit<PlantillaItem, "id" | "createdAt">, imagenes?: string[]): Promise<PlantillaItem> {
        const plantilla = await prisma.plantillaItem.create({
            data: {
                nombre: data.nombre,
                fabricante: data.fabricante,
                modelo: data.modelo,
                prefijo: data.prefijo,
                categoriaId: data.categoriaId,
                imagenes: imagenes ? {
                    create: imagenes.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(plantilla);
    }

    async update(id: number, data: Partial<Omit<PlantillaItem, "id" | "createdAt">>, imagenes?: string[]): Promise<PlantillaItem> {
        // If new images are provided, we might want to handle replacement or addition.
        // For simplicity, we'll replace them if provided.
        if (imagenes) {
            await prisma.imagenPlantillaItem.deleteMany({
                where: { plantillaItemId: id }
            });
        }

        const plantilla = await prisma.plantillaItem.update({
            where: { id },
            data: {
                nombre: data.nombre,
                fabricante: data.fabricante,
                modelo: data.modelo,
                prefijo: data.prefijo,
                categoriaId: data.categoriaId,
                imagenes: imagenes ? {
                    create: imagenes.map(url => ({ url }))
                } : undefined
            },
            include: { imagenes: true }
        });
        return this.mapToDomain(plantilla);
    }

    async delete(id: number): Promise<void> {
        const hasItems = await prisma.item.count({
            where: { plantillaId: id }
        });

        if (hasItems > 0) {
            throw new Error("No se puede eliminar la plantilla porque tiene ítems asociados. Elimina primero los ítems.");
        }

        // cascade delete images if not handled by prisma schema
        await prisma.imagenPlantillaItem.deleteMany({
            where: { plantillaItemId: id }
        });
        await prisma.plantillaItem.delete({
            where: { id }
        });
    }

    private mapToDomain(p: any): PlantillaItem {
        return new PlantillaItem(
            p.id,
            p.nombre,
            p.fabricante,
            p.modelo,
            p.prefijo,
            p.categoriaId,
            p.createdAt,
            p.imagenes?.map((img: any) => img.url)
        );
    }
}
