import { Pool } from "pg";

// Use a function to get or create the pool to ensure env vars are ready
let externalPool: Pool | null = null;

function getExternalPool(): Pool {
    if (!externalPool) {
        // Force Node to ignore self-signed certs (Aiven workaround)
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

        // Remove sslmode=require to prevent it from forcing verification
        const connectionString = (process.env.DATABASE_URL2 || "").replace("sslmode=require", "sslmode=disabled");

        externalPool = new Pool({
            connectionString: connectionString,
            ssl: {
                rejectUnauthorized: false,
            }
        });
    }
    return externalPool!;
}

export interface ExternalUser {
    id: string; // ru or ci
    tipo: "Estudiante" | "Externo";
    nombres: string;
    apellidop: string;
    apellidom: string;
    correo?: string;
    celular?: string;
}

export class ExternalUserService {
    async searchUser(query: string, type: string = "Estudiante"): Promise<ExternalUser[]> {
        const results: ExternalUser[] = [];

        try {
            if (type === "Estudiante") {
                // Search in Estudiante (ru)
                if (/^\d+$/.test(query)) {
                    const ru = parseInt(query);
                    const estRes = await getExternalPool().query(
                        "SELECT ru, nombres, apellidop, apellidom, correo, celular FROM \"Estudiante\" WHERE ru = $1",
                        [ru]
                    );

                    for (const row of estRes.rows) {
                        results.push({
                            id: row.ru.toString(),
                            tipo: "Estudiante",
                            nombres: row.nombres,
                            apellidop: row.apellidop,
                            apellidom: row.apellidom,
                            correo: row.correo,
                            celular: row.celular
                        });
                    }
                }

                if (results.length === 0) {
                    const searchStr = `%${query}%`;
                    const estRes = await getExternalPool().query(
                        "SELECT ru, nombres, apellidop, apellidom, correo, celular FROM \"Estudiante\" WHERE nombres ILIKE $1 OR apellidop ILIKE $1 OR apellidom ILIKE $1 LIMIT 5",
                        [searchStr]
                    );
                    for (const row of estRes.rows) {
                        results.push({ id: row.ru.toString(), tipo: "Estudiante", ...row });
                    }
                }
            } else {
                // Search in Externo (ci)
                if (/^\d+$/.test(query)) {
                    const ci = parseInt(query);
                    const extRes = await getExternalPool().query(
                        "SELECT ci, nombres, apellidop, apellidom, correo, celular FROM \"Externo\" WHERE ci = $1",
                        [ci]
                    );

                    for (const row of extRes.rows) {
                        results.push({
                            id: row.ci.toString(),
                            tipo: "Externo",
                            nombres: row.nombres,
                            apellidop: row.apellidop,
                            apellidom: row.apellidom,
                            correo: row.correo,
                            celular: row.celular
                        });
                    }
                }

                if (results.length === 0) {
                    const searchStr = `%${query}%`;
                    const extRes = await getExternalPool().query(
                        "SELECT ci, nombres, apellidop, apellidom, correo, celular FROM \"Externo\" WHERE nombres ILIKE $1 OR apellidop ILIKE $1 OR apellidom ILIKE $1 LIMIT 5",
                        [searchStr]
                    );
                    for (const row of extRes.rows) {
                        results.push({ id: row.ci.toString(), tipo: "Externo", ...row });
                    }
                }
            }

        } catch (error) {
            console.error("Error searching external users:", error);
            throw error;
        }

        return results;
    }
}
