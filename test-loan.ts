
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testLoan() {
    try {
        console.log("Testing loan creation...");
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found in database. Create a user first.");
            return;
        }

        const item = await prisma.item.findFirst();
        if (!item) {
            console.log("No items found in database.");
            return;
        }

        const prestamo = await prisma.prestamo.create({
            data: {
                tipoUsuario: "Estudiante",
                usuarioIdentificador: "TEST-123",
                usuarioNombre: "Usuario de Prueba",
                fechaEstimadaEntrega: new Date(),
                userIdSalida: user.id,
                detalles: {
                    create: [
                        { itemId: item.id, cantidad: 1 }
                    ]
                }
            }
        });

        console.log("Success! Created loan ID:", prestamo.id);

        // Clean up
        await prisma.detallePrestamo.deleteMany({ where: { prestamoId: prestamo.id } });
        await prisma.prestamo.delete({ where: { id: prestamo.id } });
        console.log("Cleaned up test loan.");

    } catch (e) {
        console.error("Test failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testLoan();
