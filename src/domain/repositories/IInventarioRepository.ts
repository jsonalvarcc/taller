import { Categoria, PlantillaItem, Item, Pieza } from "../entities/Inventario";

export interface ICategoriaRepository {
    findAll(): Promise<Categoria[]>;
    findById(id: number): Promise<Categoria | null>;
    create(data: Omit<Categoria, "id" | "createdAt">): Promise<Categoria>;
    update(id: number, data: Partial<Omit<Categoria, "id" | "createdAt">>): Promise<Categoria>;
    delete(id: number): Promise<void>;
}

export interface IPlantillaItemRepository {
    findAll(): Promise<PlantillaItem[]>;
    findById(id: number): Promise<PlantillaItem | null>;
    create(data: Omit<PlantillaItem, "id" | "createdAt">, imagenes?: string[]): Promise<PlantillaItem>;
    update(id: number, data: Partial<Omit<PlantillaItem, "id" | "createdAt">>, imagenes?: string[]): Promise<PlantillaItem>;
    delete(id: number): Promise<void>;
}

export interface IItemRepository {
    findAll(): Promise<Item[]>;
    findById(id: number): Promise<Item | null>;
    findAllByTemplate(plantillaId: number): Promise<Item[]>;
    countByTemplate(plantillaId: number): Promise<number>;
    create(data: Omit<Item, "id" | "createdAt">, imagenes?: string[]): Promise<Item>;
    update(id: number, data: Partial<Omit<Item, "id" | "createdAt">>, imagenes?: string[]): Promise<Item>;
    delete(id: number): Promise<void>;
}

export interface IPiezaRepository {
    findAll(): Promise<Pieza[]>;
    findById(id: number): Promise<Pieza | null>;
    findAllByItem(itemId: number): Promise<Pieza[]>;
    create(data: Omit<Pieza, "id" | "createdAt">, imagenes?: string[]): Promise<Pieza>;
    update(id: number, data: Partial<Omit<Pieza, "id" | "createdAt">>, imagenes?: string[]): Promise<Pieza>;
    delete(id: number): Promise<void>;
}
