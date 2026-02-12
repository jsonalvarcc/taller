"use client";

import { useState, useEffect } from "react";


interface User {
    id: string;
    name: string;
    email: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error("Error fetching users:", data.error || "Unknown error");
                setUsers([]);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string) => {
        if (confirm("¿Estás seguro de eliminar este usuario?")) {
            await fetch(`/api/users/${id}`, { method: "DELETE" });
            fetchUsers();
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
                    <p className="text-primary font-medium italic text-sm mt-1">Directorio de personal y permisos</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted">
                            <th className="p-4 font-bold text-primary uppercase text-xs tracking-widest">Nombre</th>
                            <th className="p-4 font-bold text-primary uppercase text-xs tracking-widest">Email</th>
                            <th className="p-4 font-bold text-primary uppercase text-xs tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-zinc-500">Cargando...</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="border-t border-border hover:bg-muted/30 transition-all">
                                    <td className="p-4 text-foreground font-bold">{user.name}</td>
                                    <td className="p-4 text-muted-foreground font-medium">{user.email}</td>
                                    <td className="p-4 space-x-2">
                                        <button
                                            onClick={() => deleteUser(user.id)}
                                            className="text-red-500 hover:text-red-700 font-semibold text-sm px-3 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
