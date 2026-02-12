import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";
import bcrypt from "bcryptjs";

export class RegisterUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
        const normalizedEmail = data.email.trim().toLowerCase();
        console.log("RegisterUserUseCase: Intentando registrar usuario:", normalizedEmail);

        const existingUser = await this.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            console.log("RegisterUserUseCase: El usuario ya existe:", normalizedEmail);
            throw new Error("El usuario ya existe con este correo");
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        console.log("RegisterUserUseCase: Contraseña hasheada con éxito");

        const user = await this.userRepository.create({
            ...data,
            email: normalizedEmail,
            password: hashedPassword,
        });

        console.log("RegisterUserUseCase: Usuario creado en DB con ID:", user.id);
        return user;
    }
}
