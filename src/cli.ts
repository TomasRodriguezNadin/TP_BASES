import { readdir } from 'node:fs/promises';
import {parsearCsv} from './acciones/accionesCSV.js';
import {archivo_eventos, path_entrada } from './constantes.js';
import { escribirEnLog, instrucciones, instruccionInvalidaHandler } from './acciones/accionesLog.js';
import dotenv from "dotenv";

type operacion = {
    comando: string,
    argumentos: string[],
    funcion: Function
}

async function parsearInstrucciones(): Promise<operacion[]>{
    const archivos = await readdir(path_entrada);
    let comandos: operacion[] = [];

    if(archivos.length > 0){ 
        try{
            var {data} = await parsearCsv(archivo_eventos);
        }catch(err){
            escribirEnLog(err as string);
            var data: string[] = [];
        }

        for (const linea of data){
            const parametros = linea.split(",");
            const comando = parametros[0] ?? "";
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

async function procesarCarpeta(parametros: operacion[]){
    for(const {comando, argumentos, funcion} of parametros){
        escribirEnLog(`Ejecutando ${comando} ${argumentos}`);
        await funcion(...argumentos);
    }
}

async function main(){
    dotenv.config({ path: ["./.env", "./.env.cli"] });

    //ejecutar cada 2 segundos
    setInterval(async () => {
        try {
            const parametros = await parsearInstrucciones();
            await procesarCarpeta(parametros);
        } catch (err) {
            console.error("Error al procesar carpeta:", err);
        }
    }, 2000);
}

main();
