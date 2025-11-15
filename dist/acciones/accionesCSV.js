import { readFile, truncate, unlink } from 'node:fs/promises';
//Un mutex para atomizar la lectura y borrado
import lockfile from "proper-lockfile"; //npm install proper-lockfile
async function leerYBorrar(path) {
    let res;
    //Prohibo que cualquiera escriba en el archivo
    const aLiberar = await lockfile.lock(path, { realpath: false });
    try {
        res = await readFile(path, { encoding: 'utf8' });
        //Elimino todo el contenido del archivo
        await truncate(path, 0);
    }
    finally {
        //Libero el archivo, para que pueda ser escrito por quien quiera
        await aLiberar();
        await unlink(path);
    }
    return res;
}
export async function parsearCsv(archivoCsv) {
    if (process.env.CLI) {
        if (!archivoCsv.endsWith(".csv")) {
            throw new Error("El archivo debe ser un csv");
        }
        archivoCsv = await leerYBorrar(archivoCsv);
    }
    //const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = archivoCsv.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    const data = archivoCsv.split(/\r?\n/) // Separa en lineas
        .slice(1) // Quita el primer elemento con los titulos
        .filter(line => line.trim() !== ''); // Elimina las filas que no contienen info
    return { data, titles };
}
//# sourceMappingURL=accionesCSV.js.map