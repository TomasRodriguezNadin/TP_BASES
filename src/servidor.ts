import express from "express";
import { Client } from 'pg';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "node:url";
import { generarCertificadoPorFechaServidor, generarCertificadoPorLu} from './acciones/generacionCertificados.ts';
import {actualizarTablaAlumnosJSON, buscarAlumnoPorLU} from "./acciones/accionesSQL.ts";
import { warn } from "node:console";
import { generarCRUD } from "./crud.ts";
import type { Alumno } from "./tipos.ts";
dotenv.config({ debug: true }); // así activás el logeo


const app = express()
const port = 3000

app.use(express.json({ limit: '10mb' })); // para poder leer el body
app.use(express.urlencoded({ extended: true, limit: '10mb'  })); // para poder leer el body
app.use(express.text({ type: 'text/csv', limit: '10mb' })); // para poder leer el body como texto plano


// Servidor del frontend:
const HTML_MENU=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <h1>AIDA</h1>
        <p>menu</p>
        <p><a href="/app/lu">Imprimir certificado por LU</a></p>
        <p><a href="/app/fecha">Imprimir certificado por fecha de trámite</a></p>
        <p><a href="/app/archivo-json">Subir .csv con novedades de alumnos</a></p>
        <p><a href="/app/alumnos">Ver tabla de alumnos</a></p>
    </body>
</html>
`;

app.get('/app/menu', (_, res) => {
    res.send(HTML_MENU)
})

const HTML_LU=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <div>Obtener el certificado de título en trámite</div>
        <div><label>Libreta Universitaria: <input name=lu></label></div>
        <button id="btnEnviar">Pedir Certificado</button>
        <script>
            window.onload = function() {
                document.getElementById("btnEnviar").onclick = function() {
                    var lu = document.getElementsByName("lu")[0].value;
                    window.location.href = "../api/v0/lu/" + encodeURIComponent(lu);
                }
            }
        </script>
    </body>
</html>
`;

app.get('/app/lu', (_, res) => {
    res.send(HTML_LU)
})

const HTML_FECHA=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <div>Obtener el certificado de título en trámite</div>
        <div><label>Fecha del trámite: <input name=fecha type=date></label></div>
        <button id="btnEnviar">Pedir Certificado</button>
        <script>
            window.onload = function() {
                document.getElementById("btnEnviar").onclick = function() {
                    var fecha = document.getElementsByName("fecha")[0].value;
                    window.location.href = "../api/v0/fecha/" + encodeURIComponent(fecha);
                }
            }
        </script>
    </body>
</html>
`;

app.get('/app/fecha', (_, res) => {
    res.send(HTML_FECHA)
})

const HTML_ARCHIVO_JSON=
`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>CSV Upload</title>
</head>
<body>
  <h2>Subir archivo CSV</h2>
  <input type="file" id="csvFile" accept=".csv" />
  <button onclick="handleUpload()">Procesar y Enviar</button>

  <script>
    function parseCSV(text) {
      const lines = text.trim().split(/\\r?\\n/);
      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i];
        });
        return obj;
      });
      return data;
    }

    async function handleUpload() {
      const fileInput = document.getElementById('csvFile');
      const file = fileInput.files[0];
      if (!file) {
        alert('Por favor seleccioná un archivo CSV.');
        return;
      }

      const text = await file.text();
      const jsonData = parseCSV(text);

      try {
        const response = await fetch('../api/v0/alumnos', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonData)
        });

        if (response.ok) {
          alert('Datos enviados correctamente.');
        } else {
          alert('Error al enviar los datos.');
        }
      } catch (error) {
        console.error('Error en la solicitud:', error);
        alert('Error de red o en el servidor.');
      }
    }
  </script>
</body>
</html>
`;

app.get('/app/archivo-json', (_, res) => {
    res.send(HTML_ARCHIVO_JSON)
})


app.get('/app/alumnos', (_, res) => {
    const fileName = fileURLToPath(import.meta.url);
    const dirName = path.dirname(fileName);
    res.sendFile(path.join(dirName, "alumnos.html"));
})


// API DEL BACKEND
var NO_IMPLEMENTADO='<code>ERROR 404 </code> <h1> No implementado aún ⚒<h1>';
const ERROR = '<code>ERROR 404 </code> <h1> error <h1>';

async function enviarHTML(parametro: string, cliente: Client, generador: Function, res){
    const html = await generador(cliente, parametro);
    res.send(html);
}

async function enviarHTMLLU(parametro: string, cliente: Client, res){
    await enviarHTML(parametro, cliente, generarCertificadoPorLu, res);
}

async function enviarHTMLFecha(parametro: string, cliente: Client, res){
    await enviarHTML(parametro, cliente, generarCertificadoPorFechaServidor, res);
}

async function cargarAlumnosJSON(parametro: Alumno[], cliente: Client, res){
    await actualizarTablaAlumnosJSON(cliente, parametro);
    console.log("Alumnos cargados correctamente");
}

async function atenderPedido(respuesta: Function, parametro: string | Alumno[], req, res){
    console.log(req.params, req.query, req.body);
    const clientDB = new Client();
    await clientDB.connect();

    try{
        await respuesta(parametro, clientDB, res)
    }catch(err){
        res.status(404).send(ERROR.replace("error", err));
    }finally{
        await clientDB.end();
    }
}

app.get('/api/v0/lu/:lu', async (req, res) => {
    await atenderPedido(enviarHTMLLU, req.params.lu, req, res);
})

app.get('/api/v0/fecha/:fecha', async (req, res) => {
    await atenderPedido(enviarHTMLFecha, req.params.fecha, req, res)
})

app.patch('/api/v0/alumnos', async (req, res) => {
    await atenderPedido(cargarAlumnosJSON, req.body, req, res);
})

await generarCRUD(app, "/api/alumnos");

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/menu`)
})
