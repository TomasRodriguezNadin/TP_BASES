import { Client } from 'pg';
type filtro = Record<string, string> | {
    all: boolean;
};
export declare function obtenerEnums(client: Client, tipo: string): Promise<string[]>;
export declare function obtenerTipoDe(client: Client, tabla: string, Nombrecolumna: string): Promise<string>;
export declare function obtenerAtributosTabla(client: Client, tabla: string): Promise<string[][]>;
export declare function obtenerClavePrimariaTabla(client: Client, tabla: string): Promise<string[]>;
export declare function editarFilaDeTabla(client: Client, tabla: string, fila: Record<string, string>): Promise<void>;
export declare function actualizarTabla(client: Client, tabla: string, lista: string[], columnas: string[]): Promise<void>;
export declare function actualizarTablasJSON(cliente: Client, tabla: string, contenidos: Object[]): Promise<void>;
export declare function borrarFilaDeLaTabla(cliente: Client, tabla: string, filtro: filtro): Promise<void>;
export declare function buscarTabla(client: Client, tabla: string, filtro: filtro): Promise<any[]>;
export declare function buscarTodosEnTabla(client: Client, tabla: string): Promise<any[]>;
export declare function buscarDatosDeEscritura(client: Client, matricula: string, nroProtocolo: string, anio: string): Promise<any[]>;
export declare function buscarEscribanoPorMatricula(client: Client, matricula: string): Promise<any[]>;
export declare function buscarTipoPorID(client: Client, idTipo: string): Promise<any[]>;
export {};
//# sourceMappingURL=accionesSQL.d.ts.map