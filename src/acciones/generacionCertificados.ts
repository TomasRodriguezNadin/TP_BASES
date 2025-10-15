import { Client } from 'pg';
import {readFile, unlink} from 'node:fs/promises';
import { path_plantilla, path_plantilla_escritura } from '../constantes.ts';
import { esLUValida, esFechaValida } from './validaciones.ts';
import { buscarAlumnoPorLU, buscarAlumnosPorFecha, actualizarTabla, buscarEscribanoPorMatricula, buscarTipoPorID, buscarTabla } from './accionesSQL.ts';
import { parsearCsv } from './accionesCSV.ts';
import { Experiencia } from '../tipos.ts';
import type {Alumno} from '../tipos.ts';

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

    const experienciaEscribano = resEscribano[0].capacidad;
    const experienciaRequerida = resRequerida[0].experienciarequerida;
    return Experiencia[experienciaRequerida] <= Experiencia[experienciaEscribano];
}

async function filtrarEscrituras(cliente: Client, escrituras: string[], categorias: string[]): Promise<string[]>{
    const indiceMatricula = categorias.indexOf("matricula");
    const indiceTipo = categorias.indexOf("idTipo");

    let listaFiltrada: string[] = [];

    for (const linea of escrituras){
        const elementos = linea.split(",");
        const matricula = elementos[indiceMatricula];
        const idTipo = elementos[indiceTipo];
        if(await tieneExperienciaRequerida(cliente, matricula, idTipo)){
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

export async function generarCertificadoAlumno(alumno: Record<string, string>): Promise<String> {
    let certificado = await readFile(path_plantilla, {encoding: 'utf8'});
    for(const [key, value] of Object.entries(alumno)){
        certificado = certificado.replace(
            `[#${key}]`,
            comoString(value)
        );
    }
    return certificado;
}

export async function pedirEscrituras(cliente: Client, filtro: Record<string, string>): Promise<string[]>{
    const escrituras = await buscarTabla(cliente, "escrituras", filtro);
    let htmls: string[] = [];
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

export async function generarCertificadoPorLu(cliente:Client, lu:string): Promise<String>{
    if (!esLUValida(lu)) {
        throw new Error("La LU debe estar en formato NNN/YY"); //CAMBIAR
    }

    const alumno = await buscarAlumnoPorLU(cliente, lu);

    if(alumno.length == 0){
        throw new Error(`No existe alumno con libreta ${lu}`);
    }
    if(alumno[0].titulo_en_tramite === null){
        throw new Error(`El alumno de libreta ${lu} no esta tramitando su titulo`);
    } 
    const res = await generarCertificadoAlumno(alumno[0]);
    return res;
}

export async function generarCertificadoPorFechaServidor(cliente:Client, fecha:string): Promise<string> {
    if (!esFechaValida(fecha)) {
        throw new  Error("La fecha debe estar en formato YYYY-MM-DD");
    }

    const alumnos = await buscarAlumnosPorFecha(cliente, fecha);

    let res = "";

    for(const alumno of alumnos){
        res += await generarCertificadoAlumno(alumno);
        res += `\n`;
    }

    if(alumnos.length == 0){
        res += "No hay ningun alumno que se haya egresado en esa fecha";
    }

    return res;
}
