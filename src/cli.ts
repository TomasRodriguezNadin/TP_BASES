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
    for(const linea of listaAlumnos){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : `'` + dato + `'`).join(',')})`;
        console.log(instruccion);
        await client.query(instruccion);
    }
}

async function generarCertificadoAlumno(client, row) {
    console.log(row.lu);
}

async function buscarAlumnosPorFecha(client, fecha) {
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE titulo_en_tramite = '${fecha}'`;
    const alumnos = await client.query(instruccion);

    if(alumnos.rows.length === 0){
        return null;
    }

    for(const row of alumnos.rows){
        generarCertificadoAlumno(client, row)
    }
}

async function crearCertificadoPorLU(client, lu){
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE lu = '${lu}'`;
    const alumno = await client.query(instruccion);

    if(alumno.rows.length === 0){
        console.log(`No existe alumno con libreta ${lu}`);
    } else if(alumno.rows[0].titulo_en_tramite === null){
        console.log(`El alumno de libreta ${lu} no esta tramitando su titulo`);
    } else {
        await generarCertificadoAlumno(client, alumno.rows[0]);
    }
}

async function parsearYProcesarInput(cliente){
    const cantParametros = process.argv.length - 2;
    if(cantParametros !== 2){
        console.log("Introduzca una cantidad correcta de instrucciones");
        return null;
    }

    const instruccion = process.argv[process.argv.length - 2];
    const argumento = process.argv[process.argv.length - 1];
    switch (instruccion) {
        case '--archivo':
            let {data: listaAlumnos, titles: categories} = await parsearCsv(argumento);
            await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
            break;

        case `--fecha`:
            await buscarAlumnosPorFecha(cliente, argumento);
            break;

        case `--lu`:
            await crearCertificadoPorLU(cliente, argumento);
            break;

        default:
            console.log(`Introduzca una instruccion valida`);
            break;
    }
}


async function main(){
    const clientDB = new Client();
    const path = '../recursos/alumnos.csv';
    await clientDB.connect();

    await parsearYProcesarInput(clientDB);
    
    await clientDB.end();
}

main();
