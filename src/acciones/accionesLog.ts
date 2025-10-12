import { Client } from 'pg';
import {writeFile, appendFile} from 'node:fs/promises';
import { buscarAlumnosPorFecha, buscarDatosDeEscritura} from './accionesSQL.ts';
import { esFechaValida } from './validaciones.ts';
import { path_salida, archivo_log} from '../constantes.ts'
import {generarCertificadoAlumno, generarCertificadoPorLu, cargarATablaDesdeCsv, generarEscritura} from './generacionCertificados.ts';

export const instrucciones = [
    {comando: 'archivo', funcion: cargarATablaDesdeCsvLog},
    {comando: 'escritura', funcion: pedirCertificadoEscritura},    
    {comando: 'fecha', funcion: pedirCertificadoPorFecha},
    {comando: 'lu', funcion: pedirCertificadoLU},
];

export async function escribirEnLog(informacion: string){
    const tiempo = new Date().toLocaleString();

    appendFile(archivo_log, tiempo + "-- " + informacion + "\n");
}

async function accionRegistrandoErroresEnLog(accion: Function, parametro: string | string[]){
    const param = typeof parametro == 'string' ? [parametro] : parametro;
    const clientDB = new Client();
    await clientDB.connect();
    try{
        await accion(clientDB, ...param);
    }catch(err){
        escribirEnLog(err);
    }finally{
        clientDB.end();
    }
}

async function cargarATablaDesdeCsvLog(tabla: string, path: string){
    await accionRegistrandoErroresEnLog(cargarATablaDesdeCsv, [tabla, path]);
}

async function pedirCertificadoPorFecha(fecha: string){
    await accionRegistrandoErroresEnLog(generarCertificadoPorFecha, fecha);
}

async function pedirCertificadoEscritura(matricula: string, numeroProtocolo: string, anio: string){
    await accionRegistrandoErroresEnLog(generarEscrituraRegistrandoEnLog, [matricula, numeroProtocolo, anio]);
}

async function generarCertificadoPorFecha(cliente:Client, fecha:string){
    if (!esFechaValida(fecha)) {
        throw new Error("La fecha debe estar en formato YYYY-MM-DD");
    }

    const alumnos = await buscarAlumnosPorFecha(cliente, fecha);

    if(alumnos.length == 0){
        throw new Error(`No hay ningun alumno que se haya egresado en la fecha ${fecha}`);
    }

    for(const alumno of alumnos){
        const certificado = await generarCertificadoAlumno(alumno);
        escribirEnLog(`Generando certificado para ${alumno.lu}`);
        const outputFile = path_salida + `certificado${alumno.lu.replace("/", "-")}.html`;
        await writeFile(outputFile, certificado, 'utf8');
    }
}

async function pedirCertificadoLU(lu: string){
    await accionRegistrandoErroresEnLog(generarCertificadoLuRegistrandoEnLog, lu);
}

async function generarEscrituraRegistrandoEnLog(cliente: Client, matricula: string, numeroProtocolo: string, anio: string){
    
    const DatosEscritura = await buscarDatosDeEscritura(cliente, matricula, numeroProtocolo, anio) ;

    const escritura = await generarEscritura(DatosEscritura[0]);
    escribirEnLog(`Certificado nro ${numeroProtocolo}`);
    const outputFile = path_salida + `certificado${numeroProtocolo.replace("/", "-")}.html`;
    await writeFile(outputFile, escritura, 'utf8');
}

async function generarCertificadoLuRegistrandoEnLog(cliente: Client, lu: string){
    const certificado = await generarCertificadoPorLu(cliente, lu);
    escribirEnLog(`Certificado para ${lu}`);
    const outputFile = path_salida + `certificado${lu.replace("/", "-")}.html`;
    await writeFile(outputFile, certificado, 'utf8');
}

export async function instruccionInvalidaHandler(comando: string){
    escribirEnLog(`La instruccion ${comando} es invalida`);
}
