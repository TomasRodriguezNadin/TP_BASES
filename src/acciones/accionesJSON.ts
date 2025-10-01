import { parsearCsv } from "./accionesCSV.ts";

interface Alumno {
    lu: string;
    nombre: string;
    apellido: string;
    titulo: string;
    titulo_en_tramite: string;
    egreso: string;
}

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


export async function parsearJSON(json: string)
