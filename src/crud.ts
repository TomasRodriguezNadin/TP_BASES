import * as Express from "express";
import { Client } from 'pg';
import { actualizarTablasJSON, borrarAlumnoDeLaTabla, buscarTodosLosAlumnos, editarAlumnoDeTabla, obtenerAtributosTabla, obtenerClavePrimariaTabla, ordenarTodosLosAlumnos } from "./acciones/accionesSQL.ts";
import { atenderPedido } from "./servidor.ts";
import { requireAuthAPI, requireAuth } from "./servidor.ts";
import path from "path";
import { fileURLToPath } from "node:url";
import {readFile} from 'node:fs/promises';

const tablas = [
    {tabla: "alumnos", Titulo: "Alumnos"}
]

async function obtenerAlumnos(cliente: Client, req, res){
    console.log("Obteniendo los alumnos");
    const tabla = await buscarTodosLosAlumnos(cliente);
    console.log(tabla);
    res.json(tabla);
}

async function agregarAlumno(cliente: Client, req, res){
    const alumno = req.body;
    console.log("Recibiendo alumno");
    await actualizarTablasJSON(cliente, "alumnos", [alumno]);
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

function generarTable(atributos: string[]): string{
    return atributos.map((atributo: string) => 
                                `<th>${atributo} <button onclick="ordenarPor('${atributo}')">↓</button></th>`)
                                .join(`\n`);

}

function generarForm(atributos: string[]): string{
    return atributos.map((atributo: string) => 
                                `<input id="${atributo}" placeholder="${atributo}" required />`)
                                .join(`\n`);
}

async function generarHTML(tabla: string): Promise<string>{
    const fileName = fileURLToPath(import.meta.url);
    const dirName = path.dirname(fileName);
    const pathTemplate = path.join(dirName, "alumnos.html");

    let html = await readFile(pathTemplate, {encoding: 'utf8'});
    console.log("Encontramos el html");

    const cliente = new Client();
    await cliente.connect();

    let resultado = await obtenerAtributosTabla(cliente, tabla);
    const atributos = resultado.map(obj => Object.values(obj)[0]);

    resultado = await obtenerClavePrimariaTabla(cliente, tabla);
    const clavePrimaria = resultado.map(obj => Object.values(obj)[0]);
    cliente.end();

    html = html.replace(`#[Attr]`, JSON.stringify(atributos));
    html = html.replace("#[PK]", JSON.stringify(clavePrimaria));
    const table = generarTable(atributos);
    html = html.replace("#[Table]", table);
    const form = generarForm(atributos);
    html = html.replace(`#[Form]`, form);
    return html;
}

export async function generarCRUD(app: Express.Application, ruta: string){
    app.get('/app/alumnos', requireAuth, async (_, res) => {
        const html = await generarHTML("alumnos")
        res.send(html);
    })

    app.get(`${ruta}`, requireAuthAPI, async (req, res) => {
        await atenderPedido(obtenerAlumnos, "Error al listar los alumnos", req, res);
    });

    app.post(`${ruta}`, requireAuthAPI, async (req, res) => {
        await atenderPedido(agregarAlumno, "Error al agregar alumno", req, res)
    })

    app.delete(`${ruta}/:lu`, requireAuthAPI, async (req, res) => {
        await atenderPedido(borrarAlumno, "Error al borrar al alumno", req, res);
    })

    app.put(`${ruta}/:lu`, requireAuthAPI, async (req, res) => {
        await atenderPedido(editarAlumno, "Error al editar el alumno", req, res);
    })
}
