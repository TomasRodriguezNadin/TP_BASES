export interface datosTabla {
    tabla: string,
    titulo: string,
    ruta: string,
    registro: string,
    tablaVisual: string
}

export interface Atributos {
  nombre: string;
  visual: string;
}

export const columnasTabla =  
    {datos_escritura: [{nombre: "matricula", visual: "Matrícula"}, {nombre: "nro_protocolo", visual: "Número de protocolo"}, {nombre: "anio", visual: "Año"}, {nombre: "nombre_escribano", visual: "Nombre de escribano"}, {nombre: "apellido_escribano", visual: "Apellido de escribano"}, {nombre: "cuit", visual: "Cuit"}, {nombre: "nombre", visual: "Nombre"}, {nombre: "apellido", visual: "Apellido"}, {nombre: "id_tipo", visual: "ID"}, {nombre: "tipo", visual: "Tipo"}],

    escribanos: [{nombre: "matricula", visual: "Matrícula"}, {nombre: "nombre_escribano", visual: "Nombre de escribano"}, {nombre: "apellido_escribano", visual: "Apellido de escribano"}, {nombre: "capacidad", visual: "Capacidad"}, {nombre: "estado", visual: "Estado"}],

    clientes: [{nombre: "cuit", visual: "Cuit"}, {nombre: "nombre", visual: "Nombre"}, {nombre: "apellido", visual: "Apellido"}],

    escrituras: [{nombre: "matricula", visual: "Matrícula"}, {nombre: "nro_protocolo", visual: "Número de protocolo"}, {nombre: "anio", visual: "Año"}, {nombre: "cuit", visual: "Cuit"}, {nombre: "id_tipo", visual: "ID"}],

    tipo_escrituras: [{nombre: "id_tipo", visual: "ID"}, {nombre: "tipo", visual: "Tipo"}, {nombre: "experiencia_requerida", visual: "Experiencia requerida"}]}


export const enums = ["experiencia", "estado"];

export const tables: datosTabla[] = [
    {tabla: "escribanos", titulo: "Escribanos", ruta: "/api/escribanos", registro: "escribano", tablaVisual: "escribanos"},
    {tabla: "clientes", titulo: "Clientes", ruta: "/api/clientes", registro: "cliente", tablaVisual: "clientes"},
    {tabla: "tipo_escrituras", titulo: "Tipos de Escrituras", ruta: "/api/tipo_escrituras", registro: "tipo de escritura", tablaVisual: "tipo_escrituras"},
    {tabla: "escrituras", titulo: "Escrituras", ruta: "/api/escrituras", registro: "escritura", tablaVisual: "datos_escritura"}
]
