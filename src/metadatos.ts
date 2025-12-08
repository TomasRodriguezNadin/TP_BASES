export function buscarEnum(nombre: string) {
    return enums[nombre as keyof typeof enums] ?? null;
}

export function obtenerPK(tabla: string): string[] {
  return (columnasTablas[tabla] ?? [])
    .filter((col: Atributos) => col.esPK) 
    .map(col => col.nombre);
}

export interface datosTabla {
    tabla: keyof typeof columnasTablas,
    titulo: string,
    ruta: string,
    registro: string,
    tablaVisual: string
}

export interface Atributos {
  nombre: string;
  visual: string;
  tipo?: string;
  esPK?: boolean,
  esFKDe?: string;
  aVerPorUsuario?: string; //En caso de que sea un tipo enum o una FK, lo que quiero que este al lado de ella   
  
}

export const enums = {experiencia: ["principiante", "mediano", "experimentado"], estado: ["contratado", "no contratado"]};

export const columnasTablas: Record<string, Atributos[]> =  
    {
    escribanos: [{nombre: "matricula", visual: "Matrícula", tipo: "Number", esPK: true}, 
        {nombre: "nombre_escribano", visual: "Nombre de escribano", tipo: "String"}, 
        {nombre: "apellido_escribano", visual: "Apellido de escribano", tipo: "String"}, 
        {nombre: "capacidad", visual: "Capacidad", tipo: "experiencia"}, 
        {nombre: "estado", visual: "Estado", tipo: "estado"}], 

    clientes: [{nombre: "cuit", visual: "Cuit", tipo: "Number", esPK: true}, 
        {nombre: "nombre", visual: "Nombre", tipo: "String"}, 
        {nombre: "apellido", visual: "Apellido", tipo: "String"}],

    escrituras: [{nombre: "matricula", visual: "Matrícula", tipo: "Number", esPK: true, esFKDe: "escribanos", aVerPorUsuario: "apellido_escribano"}, 
        {nombre: "nro_protocolo", visual: "Número de protocolo", tipo: "Number", esPK: true}, 
        {nombre: "anio", visual: "Año", tipo: "Number", esPK: true}, 
        {nombre: "cuit", visual: "Cuit", tipo: "Number", esFKDe: "clientes"}, 
        {nombre: "id_tipo", visual: "ID", tipo: "Number", esFKDe: "tipo_escrituras", aVerPorUsuario: "tipo"}],

    tipo_escrituras: [{nombre: "id_tipo", visual: "ID", tipo: "Number", esPK: true}, 
        {nombre: "tipo", visual: "Tipo", tipo: "string", esPK: true}, 
        {nombre: "experiencia_requerida", visual: "Experiencia requerida", tipo: "experiencia"}],
    
    //Esta es una vista
     datos_escritura: [{nombre: "matricula", visual: "Matrícula"}, 
        {nombre: "nro_protocolo", visual: "Número de protocolo"},
        {nombre: "anio", visual: "Año"},
        {nombre: "nombre_escribano", visual: "Nombre de escribano"} ,
        {nombre: "apellido_escribano", visual: "Apellido de escribano"},
        {nombre: "cuit", visual: "Cuit"}, 
        {nombre: "nombre", visual: "Nombre"}, 
        {nombre: "apellido", visual: "Apellido"},
        {nombre: "id_tipo", visual: "ID"},
        {nombre: "tipo", visual: "Tipo"}]
    
    };

export const tables: datosTabla[] = [
    {tabla: "escribanos", titulo: "Escribanos", ruta: "/api/escribanos", registro: "escribano", tablaVisual: "escribanos"},
    {tabla: "clientes", titulo: "Clientes", ruta: "/api/clientes", registro: "cliente", tablaVisual: "clientes"},
    {tabla: "tipo_escrituras", titulo: "Tipos de Escrituras", ruta: "/api/tipo_escrituras", registro: "tipo de escritura", tablaVisual: "tipo_escrituras"},
    {tabla: "escrituras", titulo: "Escrituras", ruta: "/api/escrituras", registro: "escritura", tablaVisual: "datos_escritura"}
]