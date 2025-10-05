import * as Express from "express";
import { Client } from 'pg';

export async function generarCRUD(app: Express.Application){

    app.get("/api/alumnos", async (_, res) => {
        const cliente = new Client();
        await cliente.connect();
        const consulta = `SELECT * FROM tp.alumnos`;
        try{
            const tabla = await cliente.query(consulta);
            console.log(tabla.rows);
            res.json(tabla.rows);
        }catch(err){
            console.log(`Error al listar los alumnos ${err}`);
            res.status(500).json({ error : "Error al cargar los alumnos"});
        }finally{
            await cliente.end();
        }
    })
}
