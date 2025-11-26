import { Client } from 'pg';
import {readFile} from 'node:fs/promises';
import { path_plantilla_escritura } from '../constantes.js';
import { actualizarTabla, buscarEscribanoPorMatricula, buscarTipoPorID, buscarTabla } from './accionesSQL.js';
import { parsearCsv } from './accionesCSV.js';
import { Experiencia } from '../tipos.js';
import type { claveExperiencia } from '../tipos.js';

function comoString(cadena: string|null): string{
    const res = cadena === null ? '' :
                cadena;
    return res;
}

async function tieneExperienciaRequerida(cliente: Client, matricula: string, idTipo: string): Promise<boolean>{
    const resEscribano = await buscarEscribanoPorMatricula(cliente, matricula);
    if(resEscribano.length == 0) throw new Error(`No hay ningun escribano de matricula ${matricula}`);

    const resRequerida = await buscarTipoPorID(cliente, idTipo);
    if(resRequerida.length == 0) throw new Error(`No hay nigun tipo de escritura de id ${idTipo}`);

    const experienciaEscribano = resEscribano[0].capacidad as claveExperiencia;
    const experienciaRequerida = resRequerida[0].experiencia_requerida as claveExperiencia;
    return Experiencia[experienciaRequerida] <= Experiencia[experienciaEscribano];
}

async function filtrarEscrituras(cliente: Client, escrituras: string[], categorias: string[]): Promise<string[]>{
    const indiceMatricula = categorias.indexOf("matricula");
    const indiceTipo = categorias.indexOf("id_Tipo");

    let listaFiltrada: string[] = [];

    for (const linea of escrituras){
        const elementos = linea.split(",");
        const matricula = elementos[indiceMatricula];
        const idTipo = elementos[indiceTipo];
        console.log(linea);
        if(await tieneExperienciaRequerida(cliente, matricula!, idTipo!)){
            listaFiltrada.push(linea);
        }
    }

    return listaFiltrada;
}

export async function cargarATablaDesdeCsv(cliente:Client, tabla: string, path:string){
    let {data: lista, titles: categorias} = await parsearCsv(path);
    if(tabla == "escrituras"){
        lista = await filtrarEscrituras(cliente, lista, categorias);
    }
    await actualizarTabla(cliente, tabla, lista, categorias);
}

export async function pedirEscrituras(cliente: Client, filtro: Record<string, string>): Promise<string[]>{
    const escrituras = await buscarTabla(cliente, "datos_escritura", filtro);
    let htmls: string[] = escrituras.length == 0 ?
                            ["No hay ninguna escritura con esas caracteristicas"] : 
                            [];
    // Solo agrega elementos si hay escrituras
    for (const escritura of escrituras){
        const html = await generarEscritura(escritura);
        htmls.push(html);
    }
    return htmls;
}

export async function generarEscritura(datosTramite: Record<string, string>): Promise<string> {
    let certificado = await readFile(path_plantilla_escritura, {encoding: 'utf8'});
    for(const [key, value] of Object.entries(datosTramite)){
        certificado = certificado.replace(
            `[#${key}]`,
            comoString(value)
        );
    }
    return certificado;
}
