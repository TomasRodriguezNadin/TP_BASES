import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function parsearCsv(path: String) {
    const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = contents.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    // Revisar el codigo de la clase para ver por que hace slice y filter aca
    const data = contents.split(/\r?\n/) // Separa en lineas
                        .slice(1) // Quita el primer elemento con los titulos
                        .filter(line => lin.trim() !== ''); // Elimina las filas que no contienen info
    return {data, titles};
}

async function primerAlumnoPidiendoTitulo(client: Client) {
    const sql = `SELECT * FROM TP.alumnos
        WHERE titulo_en_tramite is NOT NULL
        ORDER BY egreso`
    const alumnos = await client.query(sql);

    if(alumnos.rows.length !== 0){
        return alumnos.rows[0];
    }else{
        return null;
    }
}

async function actualizarTablaAlumnos(client: Client, listaAlumnos, columnas){
    await client.query("DELETE FROM TP.alumnos");
    for(const linea of listaAlumnos){
        const datos = linea.split(',');
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : `'` + dato + `'`).join(',')})`;
        await client.query(instruccion);
    }
}


async function main(){
    const clientDB = new Client();
    const path = 'recursos/alumnos.csv';
    await clientDB.connect();

    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);

    await actualizarTablaAlumnos(clientDB, listaAlumnos, categories);
    let alumno = await primerAlumnoPidiendoTitulo(clientDB);

    if(alumno === null){
        console.log('No hay alumnos que necesitan tramitar el titulo');
    }else{
        console.log(`El alumno (${alumno}) necesita el titulo`)
    }
}

principal();
