import prisma from "../db/prisma";
import { Categoria } from "../../domain/entities/Inventario";
import { ICategoriaRepository } from "../../domain/repositories/IInventarioRepository";

export class PrismaCategoriaRepository implements ICategoriaRepository {
    async findAll(): Promise<Categoria[]> {
        const categorias = await prisma.categoria.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return categorias.map(c => this.mapToDomain(c));
    }

    async findById(id: number): Promise<Categoria | null> {
        const categoria = await prisma.categoria.findUnique({
            where: { id }
        });
        return categoria ? this.mapToDomain(categoria) : null;
    }

    async create(data: Omit<Categoria, "id" | "createdAt">): Promise<Categoria> {
        const categoria = await prisma.categoria.create({
            data: {
                nombre: data.nombre,
                prefijo: data.prefijo
            }
        });
        return this.mapToDomain(categoria);
    }

    async update(id: number, data: Partial<Omit<Categoria, "id" | "createdAt">>): Promise<Categoria> {
        const categoria = await prisma.categoria.update({
            where: { id },
            data: {
                nombre: data.nombre,
                prefijo: data.prefijo
            }
        });
        return this.mapToDomain(categoria);
    }

    async delete(id: number): Promise<void> {
        const hasTemplates = await prisma.plantillaItem.count({
            where: { categoriaId: id }
        });

        if (hasTemplates > 0) {
            throw new Error("No se puede eliminar la categoría porque tiene plantillas asociadas. Elimina primero las plantillas.");
        }

        await prisma.categoria.delete({
            where: { id }
        });
    }

    private mapToDomain(c: any): Categoria {
        return new Categoria(c.id, c.nombre, c.prefijo, c.createdAt);
    }
}
