import { parsearCsv } from "./acciones/accionesCSV.ts";
import dotenv from "dotenv";

interface Alumno {
    lu: string;
    nombre: string;
    apellido: string;
    titulo: string;
    titulo_en_tramite: string;
    egreso: string;
}


async function csvAJson(archivoCsv: string): Promise<Alumno[]>{
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
    return alumnos;
}


dotenv.config({ path: "./.env" });
const data = 
`lu,nombre,apellido,titulo,titulo_en_tramite,egreso
431/23,Tomas,Rodriguez Nadin,Licenciado en Ciencias de la Computacion,,
571/23, Antuanette Carolina,Rozas Chavez,Licenciada en Ciencias de la Computacion,,
245/23, Damian,Ortiz,Licenciado en Ciencias de la Computacion,,`


const res = await csvAJson(data);
console.log(res);
