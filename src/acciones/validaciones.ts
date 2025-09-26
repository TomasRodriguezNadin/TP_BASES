export function esLUValida(lu:string): boolean{
    return /^\d{2,4}\/\d{2}$/.test(lu);
}

export function esFechaValida(fecha: string): boolean{
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha); 
}
