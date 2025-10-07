import * as Express from "express";
import { Client } from 'pg';
import { actualizarTablaAlumnosJSON, borrarAlumnoDeLaTabla, buscarTodosLosAlumnos } from "./acciones/accionesSQL.ts";

async function obtenerAlumnos(cliente: Client, req, res){
    console.log("Obteniendo los alumnos");
    const tabla = await buscarTodosLosAlumnos(cliente);
    console.log(tabla);
    res.json(tabla);
}

async function agregarAlumno(cliente: Client, req, res){
    const alumno = req.body;
    console.log("Recibiendo alumno");
    await actualizarTablaAlumnosJSON(cliente, [alumno]);
    res.json("OK");
}

async function borrarAlumno(cliente: Client, req, res){
    console.log(`Borrando alumno con lu: ${req.params.lu}`);
    await borrarAlumnoDeLaTabla(cliente, req.params.lu);
    res.json("OK");
}

async function realizarOperacionCRUD(operacion: Function, mensajeError: string, req, res){
    const cliente = new Client();
    await cliente.connect();
    try{
        await operacion(cliente, req, res);
    }catch(err){
        console.log(mensajeError + `${err}`);
        res.status(500).json({ error : mensajeError});
    }finally{
        await cliente.end();
    }
}


export async function generarCRUD(app: Express.Application, ruta: string){

    app.get(`${ruta}`, async (req, res) => {
        await realizarOperacionCRUD(obtenerAlumnos, "Error al listar los alumnos", req, res);
    });

    app.post(`${ruta}`, async (req, res) => {
        await realizarOperacionCRUD(agregarAlumno, "Error al agregar alumno", req, res)
    })

    app.delete(`${ruta}/:lu`, async (req, res) => {
        await realizarOperacionCRUD(borrarAlumno, "Error al borrar al alumno", req, res);
    })
}
