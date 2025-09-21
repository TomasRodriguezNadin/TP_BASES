import { readFile, writeFile, truncate} from 'node:fs/promises';
//Un mutex para atomizar la lectura y borrado
import lockfile from "proper-lockfile"; //npm install proper-lockfile

async function leerYBorrar(path: string): Promise<string>{
    let res:string;

    //Prohibo que cualquiera escriba en el archivo
    const aLiberar = await lockfile.lock(path, {realpath: false});

    try{
        res = await readFile(path, {encoding: 'utf8'});

        //Elimino todo el contenido del archivo
        await truncate(path, 0);

        //Salvo la primera linea (Nombre de columnas)
        await writeFile(path, res.split(/\r?\n/)[0] + "\n");
    } finally{
        //Libero el archivo, para que pueda ser escrito por quien quiera
        await aLiberar(); 
    }    

    return res;

} 

export async function parsearCsv(path:string): Promise<{data:string[], titles:string[]}>{
    if(!path.endsWith(".csv")){
        console.log("El archivo debe ser un csv");
        return {data: [], titles: []};
    }

    const contents = await leerYBorrar(path);

    //const contents = await readFile(path, {encoding: 'utf8'});
    const firstLine = contents.split(/\r?\n/)[0];
    const titles = firstLine.split(',').map(title => title.trim());
    const data = contents.split(/\r?\n/) // Separa en lineas
                        .slice(1) // Quita el primer elemento con los titulos
                        .filter(line => line.trim() !== ''); // Elimina las filas que no contienen info
    return {data, titles};
}
