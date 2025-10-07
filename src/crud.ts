import * as Express from "express";
import { Client } from 'pg';
import { actualizarTablaAlumnosJSON, borrarAlumnoDeLaTabla } from "./acciones/accionesSQL.ts";

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
    });

    app.post("/api/alumnos", async (req, res) => {
        const cliente = new Client();
        await cliente.connect();
        let alumno = req.body;
        console.log("Recibiendo alumno");

        try{
            await actualizarTablaAlumnosJSON(cliente, [alumno]);
            res.json("OK");
        }catch(err){
            console.log(`Error al agregar alumno ${err}`);
            res.status(500).json({ error: "Error al agregar el alumno"});
        }finally{
            await cliente.end();
        }
    })
    app.delete("/api/alumnos/:lu", async (req, res) => {
        const cliente = new Client();
        await cliente.connect();
        console.log(`Borrando alumno con lu: ${req.params.lu}`);
        try{
            await borrarAlumnoDeLaTabla(cliente, req.params.lu);
            res.json("OK");
        }catch(err){
            console.log(`Error al borrar alumno ${err}`);
            res.status(500).json({ error: "Error al borrar el alumno"});
        }finally{
            await cliente.end();
        }
    })
}
