import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaUserRepository } from "@/infrastructure/repositories/PrismaUserRepository";
import { authConfig } from "./auth.config";

const userRepository = new PrismaUserRepository();

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log("Auth: Credenciales faltantes");
                    return null;
                }

                const normalizedEmail = (credentials.email as string).trim().toLowerCase();
                console.log("Auth: Intentando authorize para:", normalizedEmail);

                const user = await userRepository.findByEmail(normalizedEmail);
                if (!user) {
                    console.log("Auth: Usuario no encontrado en DB:", normalizedEmail);
                    return null;
                }

                console.log("Auth: Usuario encontrado, verificando contraseña...");
                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordCorrect) {
                    console.log("Auth: Contraseña incorrecta para:", normalizedEmail);
                    return null;
                }

                console.log("Auth: Login exitoso para:", normalizedEmail);
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
});
