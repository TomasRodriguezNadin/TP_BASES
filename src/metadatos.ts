interface PedidoMetadatos {
    tabla: keyof typeof columnasTablas;
    columnas: string[]; }

export function buscarEnum(nombre: string) {
    return enums[nombre as keyof typeof enums] ?? null;
}

export function obtenerPK(tabla: keyof typeof columnasTablas): string[] {
    return columnasTablas[tabla].filter(col => col.esPK).map(col => col.nombre);
}

function obtenerMetadatosDe(datosAObtener: PedidoMetadatos[]): Atributos[]{
    
    const res: Atributos[] = [];

    for (const pedido of datosAObtener) {

        const columnas = columnasTablas[pedido.tabla];

        const filtradas = columnas.filter(col => pedido.columnas.includes(col.nombre));
        res.push(...filtradas);
    }

    return res;
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
  tipo: string;
  esPK: boolean,
  esFKDe: string | null;
  aVerPorUsuario: string | null; //En caso de que sea un tipo enum o una FK, lo que quiero que este al lado de ella   
  
}

export const enums = {experiencia: ["principiante", "mediano", "experimentado"], estado: ["contratado", "no contratado"]};

const columnasTablas =  
    {
    escribanos: [{nombre: "matricula", visual: "Matrícula", tipo: "Number", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "nombre_escribano", visual: "Nombre de escribano", tipo: "String", esPK: false, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "apellido_escribano", visual: "Apellido de escribano", tipo: "String", esPK: false, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "capacidad", visual: "Capacidad", tipo: "experiencia", esPK: false, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "estado", visual: "Estado", tipo: "estado", esPK: false, esFKDe: null, aVerPorUsuario: null}], 

    clientes: [{nombre: "cuit", visual: "Cuit", tipo: "Number", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "nombre", visual: "Nombre", tipo: "String", esPK: false, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "apellido", visual: "Apellido", tipo: "String", esPK: false, esFKDe: null, aVerPorUsuario: null}],

    escrituras: [{nombre: "matricula", visual: "Matrícula", tipo: "Number", esPK: true, esFKDe: "escribanos", aVerPorUsuario: "apellido_escribano"}, 
        {nombre: "nro_protocolo", visual: "Número de protocolo", tipo: "Number", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "anio", visual: "Año", tipo: "Number", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "cuit", visual: "Cuit", tipo: "Number", esPK: false, esFKDe: "clientes", aVerPorUsuario: null}, 
        {nombre: "id_tipo", visual: "ID", tipo: "Number", esPK: false, esFKDe: "tipo_escrituras", aVerPorUsuario: "tipo"}],

    tipo_escrituras: [{nombre: "id_tipo", visual: "ID", tipo: "Number", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "tipo", visual: "Tipo", tipo: "string", esPK: true, esFKDe: null, aVerPorUsuario: null}, 
        {nombre: "experiencia_requerida", visual: "Experiencia requerida", tipo: "experiencia", esPK: false, esFKDe: null, aVerPorUsuario: null}]}


export const columnasTablasYVistas =
{...columnasTablas,
   datos_escritura: 
        obtenerMetadatosDe(
        [{tabla: "escrituras", columnas: ["matricula", "nro_protocolo", "anio"]},
            {tabla: "escribanos", columnas: ["nombre_escribano", "apellido_escribano"]},
            {tabla: "escrituras", columnas: ["cuit"]},
            {tabla: "clientes", columnas: ["nombre", "apellido"]},
            {tabla: "escrituras", columnas: ["id_tipo"]},
            {tabla: "tipo_escrituras", columnas: ["tipo"]}
        ])
}

export const tables: datosTabla[] = [
    {tabla: "escribanos", titulo: "Escribanos", ruta: "/api/escribanos", registro: "escribano", tablaVisual: "escribanos"},
    {tabla: "clientes", titulo: "Clientes", ruta: "/api/clientes", registro: "cliente", tablaVisual: "clientes"},
    {tabla: "tipo_escrituras", titulo: "Tipos de Escrituras", ruta: "/api/tipo_escrituras", registro: "tipo de escritura", tablaVisual: "tipo_escrituras"},
    {tabla: "escrituras", titulo: "Escrituras", ruta: "/api/escrituras", registro: "escritura", tablaVisual: "datos_escritura"}
]