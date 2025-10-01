import { parsearCsv } from "./accionesCSV.ts";
import type {Alumno} from "../tipos.ts";

export async function csvAJson(archivoCsv: string): Promise<string>{
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
