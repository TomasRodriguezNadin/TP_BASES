import { Client } from 'pg';

export async function crearCliente(): Client{
    const clientDB = new Client();
    await clientDB.connect();
    return clientDB;
}

