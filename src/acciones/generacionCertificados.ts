import { Client } from 'pg';
import {readFile, unlink} from 'node:fs/promises';
import { path_plantilla } from '../constantes.ts';
import { esLUValida, esFechaValida } from './validaciones.ts';
import { buscarAlumnoPorLU, buscarAlumnosPorFecha, actualizarTablaAlumnos, actualizarTablaAlumnosJSON } from './accionesSQL.ts';
import { parsearCsv } from './accionesCSV.ts';
import type {Alumno} from '../tipos.ts';

function comoString(cadena: string|null): string{
    const res = cadena === null ? '' :
                cadena;
    return res;
}

export async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    const {data: listaAlumnos, titles: categories} = await parsearCsv(path);
    await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
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

export async function generarCertificadoPorLuServidor(cliente: Client, lu: string): Promise<String>{
    try{
        const certificado = await generarCertificadoPorLu(cliente, lu);
        return certificado;
    }catch(err){
        return err.message;
    }
}

export async function generarCertificadoPorFechaServidor(cliente:Client, fecha:string): Promise<string> {
    if (!esFechaValida(fecha)) {
        return "La fecha debe estar en formato YYYY-MM-DD";
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
