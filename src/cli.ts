import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function parsearCsv(path) {
    const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = contents.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    // Revisar el codigo de la clase para ver por que hace slice y filter aca
    const data = contents.split(/\r?\n/) // Separa en lineas
                        .slice(1) // Quita el primer elemento con los titulos
                        .filter(line => line.trim() !== ''); // Elimina las filas que no contienen info
    return {data, titles};
}

async function primerAlumnoPidiendoTitulo(client) {
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

async function actualizarTablaAlumnos(client, listaAlumnos, columnas){
    await client.query("DELETE FROM TP.alumnos");
    for(const linea of listaAlumnos){
        const datos = linea.split(',');
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : `'` + dato + `'`).join(',')})`;
        console.log(instruccion);
        await client.query(instruccion);
    }
}


async function main(){
    const clientDB = new Client();
    const path = '../recursos/alumnos.csv';
    await clientDB.connect();

    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);

    await actualizarTablaAlumnos(clientDB, listaAlumnos, categories);
    let alumno = await primerAlumnoPidiendoTitulo(clientDB);

    if(alumno === null){
        console.log('No hay alumnos que necesitan tramitar el titulo');
    }else{
        console.log(`El alumno (${alumno}) necesita el titulo`)
    }
    await clientDB.end();

    const cantParametros = process.argv.length - 2;
    if(cantParametros !== 2){
        console.log("Introduzca una cantidad correcta de instrucciones");
    }else{
        const instruccion = process.argv[process.argv.length - 2];
        const argumento = process.argv[process.argv.length - 1];
        if(instruccion === '--archivo'){
            console.log(`Refrescar base de datos con csv (${argumento})`);
        } else if(instruccion === `--fecha`){
            console.log(`Buscar alumnos por fecha (${argumento})`);
        } else if(instruccion === `--lu`){
            console.log(`Buscar titulo de alumno de lu (${argumento})`);
        } else{
            console.log(`Introduzca una instruccion valida`);
        }
    }
}

main();
