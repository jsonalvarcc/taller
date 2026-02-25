import prisma from "../db/prisma";

export class PrismaPrestamoRepository {
    async create(data: {
        tipoUsuario: string;
        usuarioIdentificador: string;
        usuarioNombre: string;
        fechaEstimadaEntrega: Date;
        userIdSalida: string;
        detalles: {
            itemId?: number;
            piezaId?: number;
            cantidad: number;
        }[];
    }) {
        return await prisma.prestamo.create({
            data: {
                tipoUsuario: data.tipoUsuario,
                usuarioIdentificador: data.usuarioIdentificador,
                usuarioNombre: data.usuarioNombre,
                fechaEstimadaEntrega: data.fechaEstimadaEntrega,
                userIdSalida: data.userIdSalida,
                detalles: {
                    create: data.detalles.map(d => ({
                        itemId: d.itemId,
                        piezaId: d.piezaId,
                        cantidad: d.cantidad
                    }))
                }
            },
            include: {
                detalles: {
                    include: {
                        item: true,
                        pieza: true
                    }
                },
                usuarioSalida: true
            }
        });
    }

    async findAll() {
        return await prisma.prestamo.findMany({
            include: {
                detalles: {
                    include: {
                        item: { include: { imagenes: true } },
                        pieza: { include: { imagenes: true } }
                    }
                },
                usuarioSalida: true,
                usuarioEntrega: true
            },
            orderBy: { fechaSalida: 'desc' }
        });
    }

    async findActiveByItemOrPieza(itemId?: number, piezaId?: number) {
        return await prisma.detallePrestamo.findMany({
            where: {
                OR: [
                    { itemId: itemId },
                    { piezaId: piezaId }
                ],
                devuelto: false
            }
        });
    }

    async processReturn(prestamoId: number, userIdEntrega: string, detallesDevueltos: {
        detalleId: number;
        estadoDevolucion: string;
        observacionDevolucion?: string;
    }[]) {
        // Update each line item
        for (const d of detallesDevueltos) {
            await prisma.detallePrestamo.update({
                where: { id: d.detalleId },
                data: {
                    devuelto: true,
                    fechaDevolucion: new Date(),
                    estadoDevolucion: d.estadoDevolucion,
                    observacionDevolucion: d.observacionDevolucion
                }
            });
        }

        // Check if all are returned to close the loan
        const pending = await prisma.detallePrestamo.count({
            where: {
                prestamoId: prestamoId,
                devuelto: false
            }
        });

        if (pending === 0) {
            return await prisma.prestamo.update({
                where: { id: prestamoId },
                data: {
                    estado: "Devuelto",
                    fechaRealEntrega: new Date(),
                    userIdEntrega: userIdEntrega
                }
            });
        }

        return await prisma.prestamo.findUnique({ where: { id: prestamoId } });
    }
}
