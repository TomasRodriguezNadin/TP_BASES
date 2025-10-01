import { parsearCsv } from "./acciones/accionesCSV.ts";
import dotenv from "dotenv";
import type {Alumno} from "./tipos.ts"

async function csvAJson(archivoCsv: string): Promise<string>{
    const {data, titles} = await parsearCsv(archivoCsv);
    let alumnos: Alumno[] = [];
    for (const linea of data){
        const lineaParseada = linea.split(",").map(value => value.trim());
        let alumno: any = {};
        titles.forEach((title: string, i: number) => {
            alumno[title] = lineaParseada[i];
        });
        alumnos.push(alumno as Alumno);
    }
    return JSON.stringify(alumnos, null, 2);
}


dotenv.config({ path: "./.env" });
const data = 
`lu,nombre,apellido,titulo,titulo_en_tramite,egreso
431/23,Tomas,Rodriguez Nadin,Licenciado en Ciencias de la Computacion,,
571/23, Antuanette Carolina,Rozas Chavez,Licenciada en Ciencias de la Computacion,,
245/23, Damian,Ortiz,Licenciado en Ciencias de la Computacion,,`


const res = await csvAJson(data);
console.log(res);
