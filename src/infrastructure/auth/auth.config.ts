import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isPublicRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
            const isApiRoute = nextUrl.pathname.startsWith("/api");

            // API routes should be handled differently or explicitly allowed if public (like registration)
            if (isApiRoute) return true;

            if (isPublicRoute) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            // Protect everything else
            return isLoggedIn;
        },
    },
    providers: [], // Empty for now, filled in auth.ts
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
