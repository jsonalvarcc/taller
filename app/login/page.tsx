"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            toast.error("Credenciales inválidas");
        } else {
            toast.success("¡Bienvenido!");
            router.push("/dashboard");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-3xl shadow-2xl border border-border">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Iniciar Sesión</h2>
                    <p className="mt-2 text-sm text-muted-foreground font-medium">Accede a tu panel de inventario</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full mt-1.5 px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Contraseña</label>
                            <input
                                type="password"
                                required
                                className="w-full mt-1.5 px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground font-medium"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 transform active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    ¿No tienes una cuenta? <a href="/register" className="font-bold text-primary hover:underline">Regístrate</a>
                </p>
            </div>
        </div>
    );
}
