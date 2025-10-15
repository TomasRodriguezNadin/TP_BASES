import { Client } from 'pg'; 

type filtro = Record<string, string> | {all: boolean};

function sqlLiteral(literal:string|number|null): string{
    const res = (literal == null ? `null` : 
                typeof literal == "number" ? `'${literal}'` :
                typeof literal == "string" ? `'${literal.replace(/'/g, `''`)}'` : undefined);

    if(res === undefined){
        throw new Error(`${literal} no es una entrada valida para la base de datos`);
    }

    return res;
}

export async function obtenerAtributosTabla(client: Client, tabla: string): Promise<string[]>{
    const consultaAtributos = `SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = '${tabla}'`;
    const res = await client.query(consultaAtributos);
    return res.rows.map(obj => Object.values(obj)[0]);;
}

export async function obtenerClavePrimariaTabla(client: Client, tabla: string): Promise<string[]>{
    const consultaPrimaryKey = `SELECT a.attname
                                FROM pg_index i
                                JOIN pg_attribute a ON a.attrelid = i.indrelid
                                    AND a.attnum = ANY(i.indkey)
                                WHERE i.indrelid = 'TP.${tabla}'::regclass
                                AND i.indisprimary;`
    const res = await client.query(consultaPrimaryKey);
    return res.rows.map(obj => Object.values(obj)[0]);;
}

export async function editarFilaDeTabla(client: Client, tabla: string, fila: Record<string, string>){
    let consulta = `UPDATE tp.${tabla}
                      SET`;
    const clavePrimaria = await obtenerClavePrimariaTabla(client, tabla);
    const entradasSinPK = Object.entries(fila).filter(([key, _]) => {return !clavePrimaria.includes(key)});
    for (const [key, value] of entradasSinPK){
        consulta += ` ${key} = ${sqlLiteral(value)},`;
    }
    // Para sacar la coma al final
    consulta = consulta.slice(0, -1);
    let filtro = {};
    for (const clave of clavePrimaria){
        filtro[clave] = fila[clave];
    }
    consulta = agregarFiltroAInstruccion(consulta, filtro);
    console.log(consulta);
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


export async function actualizarTablasJSON(cliente: Client, tabla: string, contenidos:Object[]){
    
    for(const ob of contenidos){
        const columnas = Object.keys(ob).join(', ');
        const valores = Object.values(ob);
        console.log(columnas);
        console.log(valores);

        const aInsertar = valores.map((_, i) => `$${i+1}`).join(', ');

        const instruccion = `INSERT INTO TP.${tabla} (${columnas}) VALUES
                            (${aInsertar})`;

        console.log(instruccion);

        await cliente.query(instruccion, valores);
    }
}

function agregarFiltroAInstruccion(instruccion: string, filtro: filtro): string{
    if(!('all' in filtro)){
        instruccion += `\n WHERE `
        let condiciones: string[] = [];
        for (const [key, value] of Object.entries(filtro)){
            condiciones.push(`${key} = ${sqlLiteral(value)}`);
        }
        const condicion = condiciones.join("\n AND ");
        instruccion += condicion;
    }
    return instruccion;
}

export async function borrarFilaDeLaTabla(cliente: Client, tabla: string, filtro: filtro){
    let query = `DELETE FROM TP.${tabla}`;
    query = agregarFiltroAInstruccion(query, filtro);
    await cliente.query(query);
}

export async function buscarTabla(client: Client, tabla: string, filtro: filtro){
    let instruccion = `SELECT * FROM tp.${tabla}`;
    instruccion = agregarFiltroAInstruccion(instruccion, filtro);

    console.log(instruccion);

    const filas = await client.query(instruccion);
    return filas.rows;
}

export async function buscarTodosEnTabla(client: Client, tabla: string){
    return await buscarTabla(client, tabla, {all: true});
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
