import { Client } from 'pg';
import {readFile, writeFile, readdir, unlink, appendFile} from 'node:fs/promises';
import {actualizarTablaAlumnos, buscarAlumnosPorFecha, buscarAlumnoPorLU} from './acciones/accionesSQL.ts';
import {parsearCsv} from './acciones/accionesCSV.ts'
import {archivo_eventos, path_entrada, path_salida, path_plantilla, archivo_log} from './constantes.ts'
import dotenv from "dotenv";

function comoString(cadena: string|null): string{
    const res = cadena === null ? '' :
                cadena;
    return res;
}

async function generarCertificadoAlumno(alumno: Record<string, string>): Promise<String> {
    let certificado = await readFile(path_plantilla, {encoding: 'utf8'});
    for(const [key, value] of Object.entries(alumno)){
        certificado = certificado.replace(
            `[#${key}]`,
            comoString(value)
        );
    }

    const outputFile = path_salida + `certificado${alumno.lu.replace("/", "-")}.html`;
    await writeFile(outputFile, certificado, 'utf8');
    escribirEnLog(`Certificado para ${alumno.lu}`);
    return certificado;
}

async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);
    await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
    await unlink(path);
}

function esFechaValida(fecha: string): boolean{
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha); 
}

export async function generarCertificadoPorFecha(cliente:Client, fecha:string): Promise<string> {
    if (!esFechaValida(fecha)) {
        escribirEnLog("La fecha debe estar en formato YYYY-MM-DD");
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

function esLUValida(lu:string): boolean{
    return /^\d{2,4}\/\d{2}$/.test(lu);
}

export async function generarCertificadoPorLu(cliente:Client, lu:string): Promise<String>{
    if (!esLUValida(lu)) {
        escribirEnLog("La LU debe estar en formato NNN/YY");
        return "La LU debe estar en formato NNN/YY"; //CAMBIAR
    }

    const alumno = await buscarAlumnoPorLU(cliente, lu);

    if(alumno.length == 0){
        escribirEnLog(`No existe alumno con libreta ${lu}`);
        return `No existe alumno con libreta ${lu}`;
    } else if(alumno[0].titulo_en_tramite === null){
        escribirEnLog(`El alumno de libreta ${lu} no esta tramitando su titulo`);
        return `El alumno de libreta ${lu} no esta tramitando su titulo`;
    } else {
        let res = await generarCertificadoAlumno(alumno[0]);
        return res;
    }
    return ""; //CAMBIAR
}

const instrucciones = [
    {comando: 'archivo', cantArgumentos: 1, funcion: cargarAlumnosDesdeCsv},
    {comando: 'fecha', cantArgumentos: 1, funcion: generarCertificadoPorFecha},
    {comando: 'lu', cantArgumentos: 1, funcion: generarCertificadoPorLu},
];

async function instruccionInvalidaHandler(cliente: Client, comando: string){
    escribirEnLog(`La instruccion ${comando} es invalida`)
}

async function parsearInstrucciones(): Promise<{comando:string, argumentos:string[], funcion: Function}[]>{
    const archivos = await readdir(path_entrada);
    let comandos: {comando: string, argumentos: string[], funcion: Function}[] = [];

    if(archivos.length > 0){ 

        const {data} = await parsearCsv(archivo_eventos);

        for (const linea of data){
            const parametros = linea.split(",");
            const comando = parametros[0];
            const argumentos = parametros.slice(1);

            const instruccion = instrucciones.find(ins => ins.comando === comando);

            if(instruccion == null){
                comandos.push({comando, argumentos: [comando], funcion: instruccionInvalidaHandler});
            }else{
                const funcion = instruccion.funcion;
                comandos.push({comando, argumentos, funcion});
            }
        }
    }
    return comandos;
}

export async function escribirEnLog(informacion: string){
    const tiempo = new Date().toLocaleString();

    appendFile(archivo_log, tiempo + "-- " + informacion + "\n");
} 

async function procesarCarpeta(clientDB: Client){

    const parametros = await parsearInstrucciones();
    for(const {comando, argumentos, funcion} of parametros){
        escribirEnLog(`Ejecutando ${comando} ${argumentos}`);
        await funcion(clientDB, ...argumentos);
    }
}

async function main(){
    dotenv.config();
    const clientDB = new Client();
    await clientDB.connect();

    //ejecutar cada 2 segundos
    const intervalo = setInterval(async () => {
        try {
            await procesarCarpeta(clientDB);
        } catch (err) {
            console.error("Error al procesar carpeta:", err);
        }
    }, 2000);
    
    //await clientDB.end();
}

main();
