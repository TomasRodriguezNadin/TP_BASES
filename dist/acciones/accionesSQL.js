function sqlLiteral(literal) {
    const res = (literal == null ? `null` :
        typeof literal == "number" ? `'${literal}'` :
            typeof literal == "string" ? `'${literal.replace(/'/g, `''`)}'` : undefined);
    if (res === undefined) {
        throw new Error(`${literal} no es una entrada valida para la base de datos`);
    }
    return res;
}
export async function obtenerEnums(client, tipo) {
    const consultarEnums = `SELECT enumlabel
                    FROM pg_enum
                    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                    WHERE pg_type.typname = ${sqlLiteral(tipo)};`;
    const res = await client.query(consultarEnums);
    return res.rows.map(row => row.enumlabel);
}
export async function obtenerTipoDe(client, tabla, Nombrecolumna) {
    const consultarEnums = `SELECT
                c.column_name,
                t.typname AS real_data_type
                FROM information_schema.columns c
                JOIN pg_type t ON t.oid = c.udt_name::regtype::oid
                WHERE c.table_name = ${sqlLiteral(tabla)} AND c.column_name = ${sqlLiteral(Nombrecolumna)} ;`;
    const res = await client.query(consultarEnums);
    return res.rows[0].real_data_type;
}
export async function obtenerAtributosTabla(client, tabla) {
    const consultaAtributos = `SELECT column_name, data_type
                    FROM information_schema.columns
                    WHERE table_name = '${tabla}'`;
    const res = await client.query(consultaAtributos);
    return res.rows.map(col => [col.column_name, col.data_type]);
}
export async function obtenerClavePrimariaTabla(client, tabla) {
    const consultaPrimaryKey = `SELECT a.attname
                                FROM pg_index i
                                JOIN pg_attribute a ON a.attrelid = i.indrelid
                                    AND a.attnum = ANY(i.indkey)
                                WHERE i.indrelid = 'TP.${tabla}'::regclass
                                AND i.indisprimary;`;
    const res = await client.query(consultaPrimaryKey);
    return res.rows.map(obj => Object.values(obj)[0]);
}
export async function editarFilaDeTabla(client, tabla, fila) {
    let consulta = `UPDATE tp.${tabla}
                      SET`;
    const clavePrimaria = await obtenerClavePrimariaTabla(client, tabla);
    const entradasSinPK = Object.entries(fila).filter(([key, _]) => { return !clavePrimaria.includes(key); });
    for (const [key, value] of entradasSinPK) {
        consulta += ` ${key} = ${sqlLiteral(value)},`;
    }
    // Para sacar la coma al final
    consulta = consulta.slice(0, -1);
    let filtro = {};
    for (const clave of clavePrimaria) {
        filtro[clave] = fila[clave];
    }
    consulta = agregarFiltroAInstruccion(consulta, filtro);
    console.log(consulta);
    await client.query(consulta);
}
export async function actualizarTabla(client, tabla, lista, columnas) {
    for (const linea of lista) {
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.${tabla} (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : sqlLiteral(dato)).join(',')})`;
        console.log(instruccion);
        await client.query(instruccion);
    }
}
export async function actualizarTablasJSON(cliente, tabla, contenidos) {
    for (const ob of contenidos) {
        const columnas = Object.keys(ob).join(', ');
        const valores = Object.values(ob);
        console.log(columnas);
        console.log(valores);
        const aInsertar = valores.map((_, i) => `$${i + 1}`).join(', ');
        const instruccion = `INSERT INTO TP.${tabla} (${columnas}) VALUES
                            (${aInsertar})`;
        console.log(instruccion);
        await cliente.query(instruccion, valores);
    }
}
function agregarFiltroAInstruccion(instruccion, filtro) {
    if (!('all' in filtro)) {
        instruccion += `\n WHERE `;
        let condiciones = [];
        for (const [key, value] of Object.entries(filtro)) {
            condiciones.push(`${key} = ${sqlLiteral(value)}`);
        }
        const condicion = condiciones.join("\n AND ");
        instruccion += condicion;
    }
    return instruccion;
}
export async function borrarFilaDeLaTabla(cliente, tabla, filtro) {
    let query = `DELETE FROM TP.${tabla}`;
    query = agregarFiltroAInstruccion(query, filtro);
    await cliente.query(query);
}
export async function buscarTabla(client, tabla, filtro) {
    let instruccion = `SELECT * FROM tp.${tabla}`;
    instruccion = agregarFiltroAInstruccion(instruccion, filtro);
    console.log(instruccion);
    const filas = await client.query(instruccion);
    return filas.rows;
}
export async function buscarTodosEnTabla(client, tabla) {
    return await buscarTabla(client, tabla, { all: true });
}
export async function buscarDatosDeEscritura(client, matricula, nroProtocolo, anio) {
    return await buscarTabla(client, "escrituras", { matricula: matricula, nro_protocolo: nroProtocolo, anio: anio });
}
export async function buscarEscribanoPorMatricula(client, matricula) {
    return await buscarTabla(client, "escribanos", { matricula: matricula });
}
export async function buscarTipoPorID(client, idTipo) {
    return await buscarTabla(client, "tipo_escrituras", { id_Tipo: idTipo });
}
//# sourceMappingURL=accionesSQL.js.map