import { Client } from 'pg';
import {readFile, writeFile, readdir} from 'node:fs/promises';
import {actualizarTablaAlumnos, buscarAlumnosPorFecha, buscarAlumnoPorLU} from './acciones/accionesSQL.ts';
import {parsearCsv} from './acciones/accionesCSV.ts'
import {archivo_eventos, path_entrada, path_salida, path_plantilla} from './constantes.ts'

function comoString(cadena: string|null): string{
    const res = cadena === null ? '' :
                cadena;
    return res;
}

async function generarCertificadoAlumno(alumno: Record<string, string>) {
    let certificado = await readFile(path_plantilla, {encoding: 'utf8'});
    for(const [key, value] of Object.entries(alumno)){
        certificado = certificado.replace(
            `[#${key}]`,
            comoString(value)
        );
    }

    const outputFile = path_salida + `certificado${alumno.lu.replace("/", "-")}.html`;
    await writeFile(outputFile, certificado, 'utf8');
    console.log(`Certificado para ${alumno.lu}`);
}

async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);
    await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
}

function esFechaValida(fecha: string): boolean{
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha); 
}

async function generarCertificadoPorFecha(cliente:Client, fecha:string) {
    if (!esFechaValida(fecha)) {
        console.log("La fecha debe estar en formato YYYY-MM-DD");
        return null;
    }

    const alumnos = await buscarAlumnosPorFecha(cliente, fecha);   

    for(const alumno of alumnos){
        generarCertificadoAlumno(alumno);
    }
}

function esLUValida(lu:string): boolean{
    return /^\d{2,4}\/\d{2}$/.test(lu);
}

async function generarCertificadoPorLu(cliente:Client, lu:string){
    if (!esLUValida(lu)) {
        console.log("La LU debe estar en formato NNN/YY");
        return null;
    }

    const alumno = await buscarAlumnoPorLU(cliente, lu);

    if(alumno.length == 0){
        console.log(`No existe alumno con libreta ${lu}`);
    } else if(alumno[0].titulo_en_tramite === null){
        console.log(`El alumno de libreta ${lu} no esta tramitando su titulo`);
    } else {
        await generarCertificadoAlumno(alumno[0]);
    }
}

const instrucciones = [
    {comando: 'archivo', cantArgumentos: 1, funcion: cargarAlumnosDesdeCsv},
    {comando: 'fecha', cantArgumentos: 1, funcion: generarCertificadoPorFecha},
    {comando: 'lu', cantArgumentos: 1, funcion: generarCertificadoPorLu},
];

const prefijoComando = '--';

async function parsearInput(): Promise<{comando:string, argumentos:string[], funcion: Function}[]>{
    let ind = 0;
    const cantParametros = process.argv.length;
    let comandos: {comando: string, argumentos: string[], funcion: Function}[] = [];

    while (ind < cantParametros){
        const parametro = process.argv[ind];
        ind++;

        if(parametro.startsWith(prefijoComando)){
            const comando = parametro.slice(prefijoComando.length);
            const instruccion = instrucciones.find(ins => ins.comando === comando)
            if(instruccion == null) throw new Error(`${comando} no es un comando valido`);
            const argumentos = process.argv.slice(ind, ind + instruccion.cantArgumentos);
            const funcion = instruccion.funcion;
            comandos.push({comando, argumentos, funcion});
        }
    }

    return comandos;
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

            //TODO: funciones para handlear instrucciones invalidas y un log
            //if(instruccion == null){
            //    comandos.push({comando, argumentos: [comando], instruccionInvalidaHandler});
            //}else if(instruccion.cantArgumentos != argumentos.length){
            //    comandos.push({comando, argumentos, cantidadInvalidaDeArgumentosHandler});
            //}else{
                const funcion = instruccion.funcion;
                comandos.push({comando, argumentos, funcion});
            //}
        }
    }
    return comandos;
}


async function main(){
    const clientDB = new Client();
    await clientDB.connect();

    const parametros = await parsearInstrucciones();
    for(const {comando, argumentos, funcion} of parametros){
        console.log(`Ejecutando ${comando} ${argumentos}`);
        await funcion(clientDB, ...argumentos);
    }
    
    await clientDB.end();
}

main();
