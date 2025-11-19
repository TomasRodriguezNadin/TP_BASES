import * as Express from "express";
import type { Request, Response } from "express";
import { Client } from 'pg';
import { actualizarTablasJSON, borrarFilaDeLaTabla, buscarTodosEnTabla, editarFilaDeTabla, obtenerAtributosTabla, obtenerClavePrimariaTabla, obtenerEnums, obtenerTipoDe} from "./acciones/accionesSQL.js";
import { requireAuthAPI, requireAuth } from "./servidor.js";
import {readFile} from 'node:fs/promises';
import { crearCliente } from "./acciones/coneccion.js";
import { path_plantilla_tabla } from "./constantes.js";

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

async function obtenerFilas(cliente: Client, tabla: string, _: Request, res: Response){
    const filas = await buscarTodosEnTabla(cliente, tabla);
    console.log(filas);
    res.json(filas);
}

async function agregarFila(cliente: Client, tabla: string, req: Request, res: Response){
    const fila = req.body;
    await actualizarTablasJSON(cliente, tabla, [fila]);
    res.json("OK");
}

async function borrarFila(cliente: Client, tabla: string, req: Request, res: Response){
    await borrarFilaDeLaTabla(cliente, tabla, req.params);
    res.json("OK");
}

async function editarFila(cliente: Client, tabla: string, req: Request, res: Response){
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


async function generarForm(cliente: Client, atributos: string[][], tabla: string): Promise<string>{

    const res = await Promise.all(atributos.map(async (atributo: string[]) =>{ 

        if(atributo[1] == 'USER-DEFINED'){
            console.log(await obtenerTipoDe(cliente, tabla, atributo[0] as string));
            let enums = await obtenerEnums(cliente, await obtenerTipoDe(cliente, tabla, atributo[0] as string));
            
            const opcionesHTML = enums
          .map(valor => `<option value="${valor}">${valor}</option>`)
          .join('\n');

        return `
          <label for="${atributo[0]}">${atributo[0]!.replace("_", " ")}:</label>
          <select id="${atributo[0]}" name="${atributo[0]}" required>
            <option value="">Seleccione una opción</option>
            ${opcionesHTML}
          </select>
        `;
        }

        return `<input id="${atributo[0]}" placeholder="${atributo[0]!.replace("_", " ")}" required />`;
        
    })); 
    
    return res.join('\n');
        
}

async function generarHTML(datos: datosTabla): Promise<string>{
    const textos = {
        tituloLista: `${datos.titulo}`,
        entidad: `${datos.registro}`
    };


    let html = await readFile(path_plantilla_tabla, {encoding: 'utf8'});
    for (const [clave, valor] of Object.entries(textos)) {
        html = html.replaceAll(`{{${clave}}}`, valor);
    }
    console.log("Encontramos el html");
    const cliente = await crearCliente();

    let atributos = await obtenerAtributosTabla(cliente, datos.tabla);

    const clavePrimaria = await obtenerClavePrimariaTabla(cliente, datos.tabla);
    

    html = html.replace(`#[Attr]`, JSON.stringify(atributos));
    html = html.replace("#[PK]", JSON.stringify(clavePrimaria));

    const table = generarTable(atributos.map(elem => elem[0] as string));
    html = html.replace("#[Table]", table);

    const form = await generarForm(cliente, atributos, datos.tabla);

    html = html.replace(`#[Form]`, form);

    cliente.end();

    html = html.replace(`#[Ruta]`, `"${datos.ruta}"`);
    return html;
}

async function atenderPedido(respuesta: Function, tabla: string, req: Request, res: Response){
    console.log(req.params, req.query, req.body);
    const clientDB = await crearCliente();

    try{
        await respuesta(clientDB, tabla, req, res);
    }catch(err){
        const ERROR = "ERROR 404: error";
        console.log(`${err}`);
        res.status(404).send(ERROR.replace("error", err as string));
    }finally{
        await clientDB.end();
    }
}

export async function generarCRUD(app: Express.Application){
    for (const datosTabla of tables){

        let rutaParametros = `${datosTabla.ruta}`;
        const client = await crearCliente();

        const clavePrimaria = await obtenerClavePrimariaTabla(client, datosTabla.tabla);
        for (const clave of clavePrimaria){
            rutaParametros += `/:${clave}`;
        }

        app.get(`/app/${datosTabla.tabla}`, requireAuth, async (_: Request, res: Response) => {
            const html = await generarHTML(datosTabla);
            res.send(html);
        })

        app.get(`${datosTabla.ruta}`, requireAuthAPI, async (req: Request, res: Response) => {
            await atenderPedido(obtenerFilas, datosTabla.tabla, req, res);
        });

        app.post(`${datosTabla.ruta}`, requireAuthAPI, async (req: Request, res: Response) => {
            await atenderPedido(agregarFila, datosTabla.tabla, req, res)
        })

        app.delete(rutaParametros, requireAuthAPI, async (req: Request, res: Response) => {
            await atenderPedido(borrarFila, datosTabla.tabla, req, res);
        })

        app.put(rutaParametros, requireAuthAPI, async (req: Request, res: Response) => {
            await atenderPedido(editarFila, datosTabla.tabla, req, res);
        })

    }
}
