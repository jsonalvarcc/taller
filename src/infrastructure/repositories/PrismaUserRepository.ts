import prisma from "../db/prisma";
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";

export class PrismaUserRepository implements IUserRepository {
    async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
            },
        });
        return this.mapToDomain(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user ? this.mapToDomain(user) : null;
    }

    async findAll(): Promise<User[]> {
        const users = await prisma.user.findMany();
        return users.map((u) => this.mapToDomain(u));
    }

    async update(id: string, data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User> {
        const user = await prisma.user.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                password: data.password,
            },
        });
        return this.mapToDomain(user);
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({
            where: { id },
        });
    }

    private mapToDomain(prismaUser: any): User {
        return new User(
            prismaUser.id,
            prismaUser.name,
            prismaUser.email,
            prismaUser.password,
            prismaUser.createdAt,
            prismaUser.updatedAt
        );
    }
}
