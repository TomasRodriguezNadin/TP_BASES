import * as fs from 'fs/promises';

async function procesarDatos(fileCsv: string){
    const instructionCsv = fileCsv.slice(0, -4) + "instruccion.csv";

    const contenido = await fs.readFile("./local-eventos/" + instructionCsv, "utf8");

    const comandos = contenido.split(", ");

    for(const c of comandos){
        console.log(c);
    }

}

async function filtrarInstrucciones(archivos: string[]): Promise<string[]>{
    const sufijo = "instruccion.csv";
    const res = archivos.filter(string => !string.endsWith(sufijo));

    return res;
}

async function procesarCarpeta(){
    const archivos = await fs.readdir('./local-eventos');
    if(archivos.length > 0){

        const datos = await filtrarInstrucciones(archivos); 
        console.log(datos);

        for(const s of datos){

            procesarDatos(s);
        }
    }
}

setInterval(procesarCarpeta, 1000);