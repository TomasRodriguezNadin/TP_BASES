export declare const instrucciones: {
    comando: string;
    funcion: typeof pedirCertificadoEscritura;
}[];
export declare function escribirEnLog(informacion: string): Promise<void>;
declare function pedirCertificadoEscritura(matricula: string, numeroProtocolo: string, anio: string): Promise<void>;
export declare function instruccionInvalidaHandler(comando: string): Promise<void>;
export {};
//# sourceMappingURL=accionesLog.d.ts.map