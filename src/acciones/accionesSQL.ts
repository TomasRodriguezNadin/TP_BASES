import { Client } from 'pg'; 
import type {Alumno} from '../tipos.ts';

type filtro = {lu : string} | {fecha: string} | {orden: string} | {all: boolean} | {matricula: string} | {idTipo: string} | {nroprotocolo:string} | {anio:string}

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

export async function actualizarTabla(client:Client, tabla: string, lista:string[], columnas:string[]){
    for(const linea of lista){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.${tabla} (${columnas.join(', ')}) VALUES
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

async function buscarTabla(client: Client, tabla: string, filtro: filtro){
    let instruccion = `SELECT * FROM tp.${tabla}
                        WHERE `;
    let condiciones: string[] = [];
    for (const [key, value] of Object.entries(filtro)){
        condiciones.push(`${key} = ${sqlLiteral(value)}`);
    }
    const condicion = condiciones.join("\n AND ");
    instruccion += condicion;
    console.log(instruccion);

    const alumnos = await client.query(instruccion);
    return alumnos.rows;
}

export async function buscarAlumnosPorFecha(client:Client, fecha: string) {
    return await buscarTabla(client, "alumnos", {fecha: fecha});
}

export async function buscarAlumnoPorLU(client:Client, lu:string){
    return await buscarTabla(client,"alumnos", {lu: lu});
}

export async function buscarTodosLosAlumnos(client: Client){
    return await buscarTabla(client,"alumnos", {all: true});
}

export async function ordenarTodosLosAlumnos(client: Client, atributo: string) {
    return await buscarTabla(client,"alumnos", {orden: atributo});
}

export async function buscarDatosDeEscritura(client: Client, matricula: string, nroProtocolo: string, anio: string){
    return await buscarTabla(client, "escrituras", {matricula:matricula, nroprotocolo:nroProtocolo, anio:anio});
}

export async function buscarEscribanoPorMatricula(client: Client, matricula: string){
    return await buscarTabla(client, "escribanos", {matricula: matricula})
}

export async function buscarTipoPorID(client: Client, idTipo: string){
    return await buscarTabla(client, "tipoescrituras", {idTipo: idTipo});
}
