import { User } from "../entities/User";

export interface IUserRepository {
    create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    update(id: string, user: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>): Promise<User>;
    delete(id: string): Promise<void>;
}
