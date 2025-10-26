import * as Express from "express";
import { Client } from 'pg';
import { actualizarTablasJSON, borrarFilaDeLaTabla, buscarTodosEnTabla, editarFilaDeTabla, obtenerAtributosTabla, obtenerClavePrimariaTabla} from "./acciones/accionesSQL.ts";
import { requireAuthAPI, requireAuth } from "./servidor.ts";
import path from "path";
import { fileURLToPath } from "node:url";
import {readFile} from 'node:fs/promises';
import { ERROR } from "./servidor.ts";

interface datosTabla {
    tabla: string,
    titulo: string,
    ruta: string,
    registro: string
}

const tables: datosTabla[] = [
    {tabla: "escribanos", titulo: "Escribanos", ruta: "/api/escribanos", registro: "escribano"},
    {tabla: "clientes", titulo: "Clientes", ruta: "/api/clientes", registro: "cliente"},
    {tabla: "tipo_escrituras", titulo: "Tipos de Escrituras", ruta: "/api/tipo_escrituras", registro: "tipo de escritura"},
    {tabla: "escrituras", titulo: "Escrituras", ruta: "/api/escrituras", registro: "escritura"}
]

async function obtenerFilas(cliente: Client, tabla: string, _, res){
    const filas = await buscarTodosEnTabla(cliente, tabla);
    console.log(filas);
    res.json(filas);
}

async function agregarFila(cliente: Client, tabla: string, req, res){
    const fila = req.body;
    await actualizarTablasJSON(cliente, tabla, [fila]);
    res.json("OK");
}

async function borrarFila(cliente: Client, tabla: string, req, res){
    await borrarFilaDeLaTabla(cliente, tabla, req.params);
    res.json("OK");
}

async function editarFila(cliente: Client, tabla: string, req, res){
    const fila = req.body;
    console.log(req.body, tabla);
    await editarFilaDeTabla(cliente, tabla, fila);
    res.json("OK");
}

function generarTable(atributos: string[]): string{
    return atributos.map((atributo: string) => 
                                `<th>${atributo.replace("_", " ")} <button onclick="ordenarPor('${atributo}')">↓</button></th>`)
                                .join(`\n`);

}

function generarForm(atributos: string[]): string{
    return atributos.map((atributo: string) => 
                                `<input id="${atributo}" placeholder="${atributo.replace("_", " ")}" required />`)
                                .join(`\n`);
}

async function generarHTML(datos: datosTabla): Promise<string>{
    const fileName = fileURLToPath(import.meta.url);
    const dirName = path.dirname(fileName);
    const pathTemplate = path.join(dirName, "template_tabla.html");
    const textos = {
        tituloLista: `${datos.titulo}`,
        entidad: `${datos.registro}`
    };


    let html = await readFile(pathTemplate, {encoding: 'utf8'});
    for (const [clave, valor] of Object.entries(textos)) {
        html = html.replaceAll(`{{${clave}}}`, valor);
    }
    console.log("Encontramos el html");

    const cliente = new Client();
    await cliente.connect();

    let atributos = await obtenerAtributosTabla(cliente, datos.tabla);

    const clavePrimaria = await obtenerClavePrimariaTabla(cliente, datos.tabla);
    cliente.end();

    html = html.replace(`#[Attr]`, JSON.stringify(atributos));
    html = html.replace("#[PK]", JSON.stringify(clavePrimaria));

    const table = generarTable(atributos);
    html = html.replace("#[Table]", table);

    const form = generarForm(atributos);
    html = html.replace(`#[Form]`, form);

    html = html.replace(`#[Ruta]`, `"${datos.ruta}"`);
    return html;
}

async function atenderPedido(respuesta: Function, tabla: string, req, res){
    console.log(req.params, req.query, req.body);
    const clientDB = new Client();
    await clientDB.connect();

    try{
        await respuesta(clientDB, tabla, req, res);
    }catch(err){
        console.log(`${err}`);
        res.status(404).send(ERROR.replace("error", err));
    }finally{
        await clientDB.end();
    }
}

export async function generarCRUD(app: Express.Application){
    for (const datosTabla of tables){

        let rutaParametros = `${datosTabla.ruta}`;
        const client = new Client();
        await client.connect();

        const clavePrimaria = await obtenerClavePrimariaTabla(client, datosTabla.tabla);
        for (const clave of clavePrimaria){
            rutaParametros += `/:${clave}`;
        }

        app.get(`/app/${datosTabla.tabla}`, requireAuth, async (_, res) => {
            const html = await generarHTML(datosTabla);
            res.send(html);
        })

        app.get(`${datosTabla.ruta}`, requireAuthAPI, async (req, res) => {
            await atenderPedido(obtenerFilas, datosTabla.tabla, req, res);
        });

        app.post(`${datosTabla.ruta}`, requireAuthAPI, async (req, res) => {
            await atenderPedido(agregarFila, datosTabla.tabla, req, res)
        })

        app.delete(rutaParametros, requireAuthAPI, async (req, res) => {
            await atenderPedido(borrarFila, datosTabla.tabla, req, res);
        })

        app.put(rutaParametros, requireAuthAPI, async (req, res) => {
            await atenderPedido(editarFila, datosTabla.tabla, req, res);
        })

    }
}
