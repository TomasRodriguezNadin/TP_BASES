import { writeFile, appendFile } from 'node:fs/promises';
import { buscarDatosDeEscritura } from './accionesSQL.js';
import { path_salida, archivo_log } from '../constantes.js';
import { cargarATablaDesdeCsv, generarEscritura } from './generacionCertificados.js';
import { crearCliente } from './coneccion.js';
export const instrucciones = [
    { comando: 'archivo', funcion: cargarATablaDesdeCsvLog },
    { comando: 'escritura', funcion: pedirCertificadoEscritura },
];
export async function escribirEnLog(informacion) {
    const tiempo = new Date().toLocaleString();
    appendFile(archivo_log, tiempo + "-- " + informacion + "\n");
}
async function accionRegistrandoErroresEnLog(accion, parametro) {
    const param = typeof parametro == 'string' ? [parametro] : parametro;
    const clientDB = await crearCliente();
    try {
        await accion(clientDB, ...param);
    }
    catch (err) {
        escribirEnLog(err);
    }
    finally {
        clientDB.end();
    }
}
async function cargarATablaDesdeCsvLog(tabla, path) {
    await accionRegistrandoErroresEnLog(cargarATablaDesdeCsv, [tabla, path]);
}
async function pedirCertificadoEscritura(matricula, numeroProtocolo, anio) {
    await accionRegistrandoErroresEnLog(generarEscrituraRegistrandoEnLog, [matricula, numeroProtocolo, anio]);
}
async function generarEscrituraRegistrandoEnLog(cliente, matricula, numeroProtocolo, anio) {
    const DatosEscritura = await buscarDatosDeEscritura(cliente, matricula, numeroProtocolo, anio);
    const escritura = await generarEscritura(DatosEscritura[0]);
    escribirEnLog(`Certificado nro ${numeroProtocolo}`);
    const outputFile = path_salida + `certificado${numeroProtocolo.replace("/", "-")}.html`;
    await writeFile(outputFile, escritura, 'utf8');
}
export async function instruccionInvalidaHandler(comando) {
    escribirEnLog(`La instruccion ${comando} es invalida`);
}
//# sourceMappingURL=accionesLog.js.map