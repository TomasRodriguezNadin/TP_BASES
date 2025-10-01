import { Client } from 'pg'; 
import type {Alumno} from '../tipos.ts';

function sqlLiteral(literal:string|null): string{
    const res = (literal == null ? `null` : 
                typeof literal == "string" ? `'${literal.replace(/'/g, `''`)}'` : undefined);

    if(res == undefined){
        throw new Error(`${literal} no es una entrada valida para la base de datos`);
    }

    return res;
}

export async function actualizarTablaAlumnos(client:Client, listaAlumnos:string[], columnas:string[]){
    for(const linea of listaAlumnos){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : sqlLiteral(dato) ).join(',')})`;
        await client.query(instruccion);
    }
}


export async function actualizarTablaAlumnosJSON(cliente: Client, listaAlumnos: Alumno[]){
    const query = `INSERT INTO TP.alumnos (lu,nombre,apellido,titulo,titulo_en_tramite,egreso)
                    VALUES (#[lu],#[nombre],#[apellido],#[titulo],#[titulo_en_tramite],#[egreso])`;
    for(const alumno of listaAlumnos){
        let queryAlumno = query;
        for(const [key, value] of Object.entries(alumno)){
            queryAlumno = queryAlumno.replace(`#[${key}]`, value === '' ? 'null' : sqlLiteral(value) );
        }
        await cliente.query(queryAlumno);
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
