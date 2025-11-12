import { Client } from 'pg';
import {writeFile, appendFile} from 'node:fs/promises';
import { buscarDatosDeEscritura} from './accionesSQL.ts';
import { path_salida, archivo_log} from '../constantes.ts'
import {cargarATablaDesdeCsv, generarEscritura} from './generacionCertificados.ts';
import { crearCliente } from './coneccion.ts';

export const instrucciones = [
    {comando: 'archivo', funcion: cargarATablaDesdeCsvLog},
    {comando: 'escritura', funcion: pedirCertificadoEscritura},    
];

export async function escribirEnLog(informacion: string){
    const tiempo = new Date().toLocaleString();

    appendFile(archivo_log, tiempo + "-- " + informacion + "\n");
}

async function accionRegistrandoErroresEnLog(accion: Function, parametro: string | string[]){
    const param = typeof parametro == 'string' ? [parametro] : parametro;
    const clientDB = await crearCliente();
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

async function pedirCertificadoEscritura(matricula: string, numeroProtocolo: string, anio: string){
    await accionRegistrandoErroresEnLog(generarEscrituraRegistrandoEnLog, [matricula, numeroProtocolo, anio]);
}

async function generarEscrituraRegistrandoEnLog(cliente: Client, matricula: string, numeroProtocolo: string, anio: string){
    
    const DatosEscritura = await buscarDatosDeEscritura(cliente, matricula, numeroProtocolo, anio) ;

    const escritura = await generarEscritura(DatosEscritura[0]);
    escribirEnLog(`Certificado nro ${numeroProtocolo}`);
    const outputFile = path_salida + `certificado${numeroProtocolo.replace("/", "-")}.html`;
    await writeFile(outputFile, escritura, 'utf8');
}

export async function instruccionInvalidaHandler(comando: string){
    escribirEnLog(`La instruccion ${comando} es invalida`);
}
