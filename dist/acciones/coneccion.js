import { Client } from 'pg';
export async function crearCliente() {
    const clientDB = process.env.DB == 'Local' ? new Client()
        : new Client({ connectionString: process.env.DATABASE_URL });
    await clientDB.connect();
    return clientDB;
}
//# sourceMappingURL=coneccion.js.map