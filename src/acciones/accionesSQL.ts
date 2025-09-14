import { Client } from 'pg'; 

export async function actualizarTablaAlumnos(client:Client, listaAlumnos:string[], columnas:string[]){
    for(const linea of listaAlumnos){
        const datos = linea.split(',').map(value => value.trim());
        const instruccion = `INSERT INTO TP.alumnos (${columnas.join(', ')}) VALUES
                            (${datos.map((dato) => dato === '' ? 'null' : `'` + dato + `'`).join(',')})`;
        console.log(instruccion);
        await client.query(instruccion);
    }
}

export async function buscarAlumnosPorFecha(client:Client, fecha: string) {
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE titulo_en_tramite = '${fecha}'`;
    const alumnos = await client.query(instruccion);

    return alumnos.rows;
}

export async function buscarAlumnoPorLU(cliente:Client, lu:string){
    const instruccion = `SELECT * FROM tp.alumnos
                        WHERE lu = '${lu}'`;
    const alumno = await cliente.query(instruccion);
    return alumno.rows;
}
