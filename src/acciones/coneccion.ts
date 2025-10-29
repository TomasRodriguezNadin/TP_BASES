import { Client } from 'pg';

export async function crearCliente(): Promise<Client>{
    const clientDB = process.env.DB == 'Local' ? new Client()
                    : new Client({ connectionString: process.env.DATABASE_URL });
    await clientDB.connect();
    return clientDB;
}

