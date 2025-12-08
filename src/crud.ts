import * as Express from "express";
import type { Request, Response } from "express";
import { Client } from 'pg';
import { actualizarTablasJSON, borrarFilaDeLaTabla, buscarTodosEnTabla, editarFilaDeTabla, obtenerCamposDeTablaCon} from "./acciones/accionesSQL.js";
import { requireAuthAPI, requireAuth } from "./servidor.js";
import {readFile} from 'node:fs/promises';
import { crearCliente } from "./acciones/coneccion.js";
import { path_plantilla_tabla } from "./constantes.js";
import {datosTabla, Atributos, columnasTablas, tables, buscarEnum, obtenerPK} from "./metadatos.js"

async function obtenerFilas(cliente: Client, tabla: string, _: Request, res: Response){
    const filas = await buscarTodosEnTabla(cliente, tabla);
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
    await editarFilaDeTabla(cliente, tabla, fila);
    res.json("OK");
}

function generarTable(atributos: Atributos[]): string{
    return atributos.map((atributo: Atributos) => 
                                `<th>${atributo.visual} <button onclick="ordenarPor('${atributo.nombre}')">↓</button></th>`)
                                .join(`\n`);

}


async function generarForm(infoAtributos: Atributos[]): Promise<string>{
    const clienteDB = await crearCliente();
    const res =  await Promise.all(infoAtributos.map(async (atributo: Atributos) =>{ 
        const infoEnum = atributo.tipo ? buscarEnum(atributo.tipo) : null; //Null si no es un enum, los enums si lo es

        if(infoEnum || atributo.esFKDe){
            const opciones = infoEnum ? infoEnum : await obtenerCamposDeTablaCon(clienteDB, atributo.esFKDe, atributo.nombre, atributo.aVerPorUsuario);
            const opcionesHTML = opciones
            .map(valor => {

            const valorReal = valor.includes("-") ? valor.split(" - ")[0] : valor;
                    
            return `<option value="${valorReal}">${valor}</option>`})
          .join('\n');

        return `
          <label for="${atributo.nombre}">${atributo.visual}:</label>
          <select id="${atributo.nombre}" name="${atributo.visual}" required>
            <option value="">Seleccione una opción</option>
            ${opcionesHTML}
          </select>
        `;
        }

        return `<input id="${atributo.nombre}" placeholder="${atributo.visual}" required />`;
        
    })); 
    await clienteDB.end();
    
    return res.join('\n');
}

async function generarHTML(datos: datosTabla): Promise<string>{
    const textos = {
        tituloLista: `${datos.titulo}`,
        entidad: `${datos.registro}`
    };
    const habilitarSolicitud = (datos.tabla === 'escribanos' || datos.tabla === 'escrituras'); 

    let html = await readFile(path_plantilla_tabla, {encoding: 'utf8'});
    for (const [clave, valor] of Object.entries(textos)) {
        html = html.replaceAll(`{{${clave}}}`, valor);
    }

    let infoAtributos = columnasTablas[datos.tabla] ?? [];
    let infoAtributosVisuales = columnasTablas[datos.tablaVisual] ?? [];

    const clavePrimaria = obtenerPK(datos.tabla);

    html = html.replace('#[Solicita]', habilitarSolicitud.toString());
    html = html.replace(`#[Attr]`, JSON.stringify(infoAtributos.map((at: Atributos) => at.nombre)));
    html = html.replace("#[PK]", JSON.stringify(clavePrimaria));

    const table = generarTable(infoAtributosVisuales);
    html = html.replace("#[Table]", table);

    const form = await generarForm(infoAtributos);

    html = html.replace(`#[Form]`, form);

    html = html.replace(`#[Ruta]`, `"${datos.ruta}"`);
    return html;
}

async function atenderPedido(respuesta: Function, tabla: string, req: Request, res: Response){
    const clientDB = await crearCliente();

    try{
        await respuesta(clientDB, tabla, req, res);
    }catch(err){
        const ERROR = "ERROR 404: error";
        console.log(req.params, req.query, req.body);
        console.log(`${err}`);
        res.status(404).send(ERROR.replace("error", err as string));
    }finally{
        await clientDB.end();
    }
}

export async function generarCRUD(app: Express.Application){
    for (const datosTabla of tables){

        let rutaParametros = `${datosTabla.ruta}`;

        const clavePrimaria = obtenerPK(datosTabla.tabla);
        for (const clave of clavePrimaria){
            rutaParametros += `/:${clave}`;
        }

        app.get(`/app/${datosTabla.tabla}`, requireAuth, async (_: Request, res: Response) => {
            const html = await generarHTML(datosTabla);
            res.send(html);
        })

        app.get(`${datosTabla.ruta}`, requireAuthAPI, async (req: Request, res: Response) => {
            await atenderPedido(obtenerFilas, datosTabla.tablaVisual, req, res);
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
