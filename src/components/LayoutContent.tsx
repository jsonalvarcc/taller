"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";

    // While checking session, we can show a minimal loader or just nothing
    // to avoid layout shifts.
    if (status === "loading") {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className={`flex-1 w-full transition-all duration-300 ${isAuthenticated ? "lg:pl-64" : ""}`}>
                <div className={isAuthenticated ? "p-4 md:p-8 lg:p-12 xl:p-16" : ""}>
                    {children}
                </div>
            </main>
        </div>
    );
}
