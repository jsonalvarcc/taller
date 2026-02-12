"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Respuesta no es JSON:", text);
                throw new Error("El servidor respondió con un error inesperado (HTML). Revisa la consola del servidor.");
            }

            if (!res.ok) {
                throw new Error(data.error || "Algo salió mal");
            }

            toast.success("¡Cuenta creada correctamente!");
            router.push("/login");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-3xl shadow-2xl border border-border">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Crear Cuenta</h2>
                    <p className="mt-2 text-sm text-muted-foreground font-medium">Únete al sistema de gestión</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">Nombre</label>
                            <input
                                type="text"
                                required
                                className="w-full mt-1.5 px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all text-foreground font-medium"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                        className="w-full py-4 px-4 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 transform active:scale-95"
                    >
                        {loading ? "Registrando..." : "Registrar"}
                    </button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta? <a href="/login" className="font-bold text-primary hover:underline">Inicia sesión</a>
                </p>
            </div>
        </div>
    );
}
