import * as Express from "express";
import { Client } from 'pg';
import { actualizarTablaAlumnosJSON, borrarAlumnoDeLaTabla, buscarTodosLosAlumnos, editarAlumnoDeTabla, ordenarTodosLosAlumnos } from "./acciones/accionesSQL.ts";
import { atenderPedido } from "./servidor.ts";

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

async function editarAlumno(cliente: Client, req, res){
    const alumno = req.body;
    console.log(`Editando alumno ${alumno.lu}`);
    await editarAlumnoDeTabla(cliente, alumno);
    res.json("OK");
}

async function ordenarAlumnos(cliente: Client, req, res) {
    const atributo = req.params.atributo;
    console.log("Ordenando los alumnos por", atributo);
    const tabla = await ordenarTodosLosAlumnos(cliente, atributo);
    console.log(tabla);
    res.json(tabla);
}

export async function generarCRUD(app: Express.Application, ruta: string){

    app.get(`${ruta}`, async (req, res) => {
        await atenderPedido(obtenerAlumnos, "Error al listar los alumnos", req, res);
    });

    app.post(`${ruta}`, async (req, res) => {
        await atenderPedido(agregarAlumno, "Error al agregar alumno", req, res)
    })

    app.delete(`${ruta}/:lu`, async (req, res) => {
        await atenderPedido(borrarAlumno, "Error al borrar al alumno", req, res);
    })

    app.put(`${ruta}/:lu`, async (req, res) => {
        await atenderPedido(editarAlumno, "Error al editar el alumno", req, res);
    })

    app.get(`${ruta}/:atributo`, async (req, res) => {
        await atenderPedido(ordenarAlumnos, "Error al ordenar los alumnos", req, res);
    });
}
