import { Client } from 'pg';
export declare function cargarATablaDesdeCsv(cliente: Client, tabla: string, path: string): Promise<void>;
export declare function pedirEscrituras(cliente: Client, filtro: Record<string, string>): Promise<string[]>;
export declare function generarEscritura(datosTramite: Record<string, string>): Promise<string>;
//# sourceMappingURL=generacionCertificados.d.ts.map