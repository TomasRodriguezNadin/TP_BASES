import { Client } from 'pg';
import { readFile } from 'node:fs/promises';
import {actualizarTablaAlumnos, buscarAlumnosPorFecha, buscarAlumnoPorLU} from './acciones/accionesSQL.ts';
import {parsearCsv} from './acciones/accionesCSV.ts'

async function generarCertificadoAlumno(client:Client, row) {
    console.log(row.lu);
}

async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    if (!path.endsWith('.csv')) {
        console.log("El archivo debe ser un csv");
        return null;
    }
    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);
    await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
}

function esFechaValida(fecha: string): bool{
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha); 
}

async function generarCertificadoPorFecha(cliente:Client, fecha:string) {
    if (!esFechaValida(fecha)) {
        console.log("La fecha debe estar en formato YYYY-MM-DD");
        return null;
    }

    const alumnos = await buscarAlumnosPorFecha(cliente, fecha);   

    for(const alumno of alumnos){
        generarCertificadoAlumno(cliente, alumno);
    }
}

function esLUValida(lu:string): bool{
    return /^\d{2,4}\/\d{2}$/.test(lu);
}

async function generarCertificadoPorLu(cliente:Client, lu:string){
    if (!esLUValida) {
        console.log("La LU debe estar en formato NNN/YY");
        return null;
    }

    const alumno = await buscarAlumnoPorLU(cliente, lu);

    if(alumno.length == 0){
        console.log(`No existe alumno con libreta ${lu}`);
    } else if(alumno[0].titulo_en_tramite === null){
        console.log(`El alumno de libreta ${lu} no esta tramitando su titulo`);
    } else {
        await generarCertificadoAlumno(cliente, alumno[0]);
    }
}

const instrucciones = [
    {comando: 'archivo', cantArgumentos: 1, funcion: cargarAlumnosDesdeCsv},
    {comando: 'fecha', cantArgumentos: 1, funcion: generarCertificadoPorFecha},
    {comando: 'lu', cantArgumentos: 1, funcion: generarCertificadoPorLu},
];

const prefijoComando = '--';

async function parsearInput():{comando:string, argumento:string[], funcion: Function}[]{
    let ind = 0;
    const cantParametros = process.argv.length;
    var comandos: {comando: string, argumento: string[], funcion: Function}[] = [];

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


async function main(){
    const clientDB = new Client();
    await clientDB.connect();

    const parametros = await parsearInput();
    for(const {comando, argumentos, funcion} of parametros){
        console.log(`Ejecutando ${comando}`);
        await funcion(clientDB, ...argumentos);
    }
    
    await clientDB.end();
}

main();
