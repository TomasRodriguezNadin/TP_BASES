import { Client } from 'pg'
import { readFile } from 'node:fs/promises';

async function parsearCsv(path: String) {
    const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = contents.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    // Revisar el codigo de la clase para ver por que hace slice y filter aca
    const data = contents.split(/\r?\n/);
    return {data, titles};
}


async function main(){
    const clientDB = new Client();
    const path = 'recursos/alumnos.csv';
    await clientDB.connect();

    let {data: listaAlumnos, titles: categories} = await parsearCsv(path);
}
