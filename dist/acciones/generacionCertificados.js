import { readFile } from 'node:fs/promises';
import { path_plantilla_escritura } from '../constantes.js';
import { actualizarTabla, buscarEscribanoPorMatricula, buscarTipoPorID, buscarTabla } from './accionesSQL.js';
import { parsearCsv } from './accionesCSV.js';
import { Experiencia } from '../tipos.js';
function comoString(cadena) {
    const res = cadena === null ? '' :
        cadena;
    return res;
}
async function tieneExperienciaRequerida(cliente, matricula, idTipo) {
    const resEscribano = await buscarEscribanoPorMatricula(cliente, matricula);
    if (resEscribano.length == 0)
        throw new Error(`No hay ningun escribano de matricula ${matricula}`);
    const resRequerida = await buscarTipoPorID(cliente, idTipo);
    if (resRequerida.length == 0)
        throw new Error(`No hay nigun tipo de escritura de id ${idTipo}`);
    const experienciaEscribano = resEscribano[0].capacidad;
    console.log(experienciaEscribano);
    const experienciaRequerida = resRequerida[0].experiencia_requerida;
    console.log(experienciaRequerida);
    console.log(Experiencia[experienciaRequerida] <= Experiencia[experienciaEscribano]);
    return Experiencia[experienciaRequerida] <= Experiencia[experienciaEscribano];
}
async function filtrarEscrituras(cliente, escrituras, categorias) {
    const indiceMatricula = categorias.indexOf("matricula");
    const indiceTipo = categorias.indexOf("id_Tipo");
    let listaFiltrada = [];
    for (const linea of escrituras) {
        const elementos = linea.split(",");
        const matricula = elementos[indiceMatricula];
        const idTipo = elementos[indiceTipo];
        console.log(linea);
        if (await tieneExperienciaRequerida(cliente, matricula, idTipo)) {
            console.log(linea);
            listaFiltrada.push(linea);
        }
    }
    return listaFiltrada;
}
export async function cargarATablaDesdeCsv(cliente, tabla, path) {
    let { data: lista, titles: categorias } = await parsearCsv(path);
    if (tabla == "escrituras") {
        lista = await filtrarEscrituras(cliente, lista, categorias);
    }
    await actualizarTabla(cliente, tabla, lista, categorias);
}
export async function pedirEscrituras(cliente, filtro) {
    const escrituras = await buscarTabla(cliente, "datos_escritura", filtro);
    let htmls = [];
    for (const escritura of escrituras) {
        const html = await generarEscritura(escritura);
        htmls.push(html);
    }
    return htmls;
}
export async function generarEscritura(datosTramite) {
    let certificado = await readFile(path_plantilla_escritura, { encoding: 'utf8' });
    for (const [key, value] of Object.entries(datosTramite)) {
        certificado = certificado.replace(`[#${key}]`, comoString(value));
    }
    return certificado;
}
//# sourceMappingURL=generacionCertificados.js.map