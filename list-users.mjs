
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function listUsers() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });
        console.log("Users in DB:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
listUsers();
