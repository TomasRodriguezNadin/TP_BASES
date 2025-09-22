import { Client } from 'pg'; 
import {escribirEnLog} from '../cli';

function sqlLiteral(literal:string|null): string{
    const res = (literal == null ? `null` : 
                typeof literal == "string" ? `'${literal.replace(/'/g, `''`)}'` : undefined);

    if(res == undefined){
        escribirEnLog(`${literal} no es una entrada valida para la base de datos`);
        throw new Error("sqlLiteral invalido");
    }

    return res;
}

export async function actualizarTablaAlumnos(client:Client, listaAlumnos:string[], columnas:string[]){
    for(const linea of listaAlumnos){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : sqlLiteral(dato) ).join(',')})`;
        escribirEnLog(instruccion);
        await client.query(instruccion);
    }
}

export async function buscarAlumnosPorFecha(client:Client, fecha: string) {
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE titulo_en_tramite = ${sqlLiteral(fecha)}`;
    const alumnos = await client.query(instruccion);

    return alumnos.rows;
}

export async function buscarAlumnoPorLU(cliente:Client, lu:string){
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE lu = ${sqlLiteral(lu)}`;
    const alumno = await cliente.query(instruccion);
    return alumno.rows;
}
