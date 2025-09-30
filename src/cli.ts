import { Client } from 'pg';
import {writeFile, readdir, unlink, appendFile} from 'node:fs/promises';
import {actualizarTablaAlumnos, buscarAlumnosPorFecha, buscarAlumnoPorLU} from './acciones/accionesSQL.ts';
import {parsearCsv} from './acciones/accionesCSV.ts'
import { esFechaValida } from './acciones/validaciones.ts';
import {archivo_eventos, path_entrada, path_salida, archivo_log} from './constantes.ts'
import dotenv from "dotenv";
import {generarCertificadoAlumno, generarCertificadoPorLu} from './acciones/generacionCertificados.ts';

async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    try{
        const {data: listaAlumnos, titles: categories} = await parsearCsv(path);
        await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
        await unlink(path);
    }catch(err){
        escribirEnLog(err);
    }
}

async function generarCertificadoPorFecha(cliente:Client, fecha:string){
    if (!esFechaValida(fecha)) {
        escribirEnLog("La fecha debe estar en formato YYYY-MM-DD");
    }

    const alumnos = await buscarAlumnosPorFecha(cliente, fecha);

    for(const alumno of alumnos){
        const certificado = await generarCertificadoAlumno(alumno);
        escribirEnLog(`Generando certificado para ${alumno.lu}`);
        const outputFile = path_salida + `certificado${alumno.lu.replace("/", "-")}.html`;
        await writeFile(outputFile, certificado, 'utf8');
    }

    if(alumnos.length == 0){
        escribirEnLog("No hay ningun alumno que se haya egresado en esa fecha");
    }
}

async function generarCertificadoLuRegistrandoEnLog(cliente: Client, lu: string){
    try{
        const certificado = await generarCertificadoPorLu(cliente, lu);
        escribirEnLog(`Certificado para ${lu}`);
        const outputFile = path_salida + `certificado${lu.replace("/", "-")}.html`;
        await writeFile(outputFile, certificado, 'utf8');
    }catch(err){
        escribirEnLog(err);
    }
}

const instrucciones = [
    {comando: 'archivo', funcion: cargarAlumnosDesdeCsv},
    {comando: 'fecha', funcion: generarCertificadoPorFecha},
    {comando: 'lu', funcion: generarCertificadoLuRegistrandoEnLog},
];

async function instruccionInvalidaHandler(cliente: Client, comando: string){
    escribirEnLog(`La instruccion ${comando} es invalida`);
}

async function parsearInstrucciones(): Promise<{comando:string, argumentos:string[], funcion: Function}[]>{
    const archivos = await readdir(path_entrada);
    let comandos: {comando: string, argumentos: string[], funcion: Function}[] = [];

    if(archivos.length > 0){ 

        try{
            var {data} = await parsearCsv(archivo_eventos);
        }catch(err){
            escribirEnLog(err);
            var data: string[] = [];
        }

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
