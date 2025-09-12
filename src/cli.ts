import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function parsearCsv(path:string) {
    const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = contents.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    // Revisar el codigo de la clase para ver por que hace slice y filter aca
    const data = contents.split(/\r?\n/) // Separa en lineas
                        .slice(1) // Quita el primer elemento con los titulos
                        .filter(line => line.trim() !== ''); // Elimina las filas que no contienen info
    return {data, titles};
}

async function actualizarTablaAlumnos(client:Client, listaAlumnos:string[], columnas:string[]){
    for(const linea of listaAlumnos){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : `'` + dato + `'`).join(',')})`;
        console.log(instruccion);
        await client.query(instruccion);
    }
}

async function generarCertificadoAlumno(client:Client, row) {
    console.log(row.lu);
}

async function buscarAlumnosPorFecha(client:Client, fecha) {
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

async function crearCertificadoPorLU(client:Client, lu:string){
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

async function cargarAlumnosDesdeCsv(cliente:Client, path:string){
    if (!path.endsWith('.csv')) {
        console.log("El archivo debe ser un csv");
        return null;
    }
    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);
    await actualizarTablaAlumnos(cliente, listaAlumnos, categories);
}

async function generarCertificadoPorFecha(cliente:Client, fecha:string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        console.log("La fecha debe estar en formato YYYY-MM-DD");
        return null;
    }
    await buscarAlumnosPorFecha(cliente, fecha);   
}

async function generarCertificadoPorLu(cliente:Client, lu:string){
    if (!/^\d{2,4}\/\d{2}$/.test(lu)) {
        console.log("La LU debe estar en formato NNN/YY");
        return null;
    }
    await crearCertificadoPorLU(cliente, lu);
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
