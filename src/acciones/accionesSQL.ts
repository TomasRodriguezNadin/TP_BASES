import { Client } from 'pg'; 
import type {Alumno} from '../tipos.ts';

type filtro = {lu : string} | {fecha: string} | {orden: string} | {all: boolean}

function sqlLiteral(literal:string|null): string{
    const res = (literal == null ? `null` : 
                typeof literal == "string" ? `'${literal.replace(/'/g, `''`)}'` : undefined);

    if(res == undefined){
        throw new Error(`${literal} no es una entrada valida para la base de datos`);
    }

    return res;
}

export async function editarAlumnoDeTabla(client: Client, alumno: Alumno){
    let consulta = `UPDATE tp.alumnos
                      SET`;
    const entradasSinLU = Object.entries(alumno).filter(([key, _]) => {return key !== `lu`});
    for (const [key, value] of entradasSinLU){
        consulta += ` ${key} = ${sqlLiteral(value)},`
    }
    // Para sacar la coma al final
    consulta = consulta.slice(0, -1);
    consulta += `\n WHERE lu=${sqlLiteral(alumno.lu)}`;
    await client.query(consulta);
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

export async function borrarAlumnoDeLaTabla(cliente: Client, lu_alumno: string){
    let query = `DELETE FROM TP.alumnos 
                WHERE lu = ${sqlLiteral(lu_alumno)}`;
    await cliente.query(query);
}

async function buscarAlumno(client: Client, filtro: filtro){
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE titulo IS NOT null
                        ${"lu" in filtro ? `AND lu = ${sqlLiteral(filtro.lu)}` : ``}
                        ${"fecha" in filtro ? `AND titulo_en_tramite = ${sqlLiteral(filtro.fecha)}` : ``}
                        ${"orden" in filtro ? `ORDER BY ${filtro.orden}` : ""}`;

    const alumnos = await client.query(instruccion);
    return alumnos.rows;
}

export async function buscarAlumnosPorFecha(client:Client, fecha: string) {
    return await buscarAlumno(client, {fecha: fecha});
}

export async function buscarAlumnoPorLU(client:Client, lu:string){
    return await buscarAlumno(client, {lu: lu});
}

export async function buscarTodosLosAlumnos(client: Client){
    return await buscarAlumno(client, {all: true});
}

export async function ordenarTodosLosAlumnos(client: Client, atributo: string) {
    return await buscarAlumno(client, {orden: atributo});
}
