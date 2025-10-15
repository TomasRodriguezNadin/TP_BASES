import express from "express";
import { Client } from 'pg';
import dotenv from "dotenv";
import { generarCertificadoPorFechaServidor, generarCertificadoPorLu} from './acciones/generacionCertificados.ts';
import {actualizarTablasJSON, buscarAlumnoPorLU} from "./acciones/accionesSQL.ts";
import { warn } from "node:console";
import { generarCRUD } from "./crud.ts";
import session from 'express-session';
import type { SessionData } from "express-session";
import { autenticarUsuario, crearUsuario } from './auth.ts';
import type { Usuario } from "./auth.ts";
import type { Request, Response, NextFunction } from "express"; 
import * as fs from 'fs';

dotenv.config({ debug: true, path: "./.env" }); // así activás el logeo

declare module 'express-session' {
    interface SessionData {
        usuario?: Usuario;
    }
}


const app = express()
const port = 3000

app.use(express.json({ limit: '10mb' })); // para poder leer el body
app.use(express.urlencoded({ extended: true, limit: '10mb'  })); // para poder leer el body
app.use(express.text({ type: 'text/csv', limit: '10mb' })); // para poder leer el body como texto plano

app.use(session({
    secret: process.env.SESSION_SECRET || 'cambiar_este_secreto_en_produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/app/login');
    }
}

// Middleware de autenticación para el backend
export function requireAuthAPI(req: Request, res: Response, next: NextFunction) {
    if (req.session.usuario) {
        next();
    } else {
        res.status(401).json({ error: 'No autenticado' });
    }
}

// Página de login
app.get('/app/login', (req, res) => {
    if (req.session.usuario) {
        return res.redirect('/app/menu');
    }
    const loginHtml = fs.readFileSync('./login.html', 'utf8');
    res.send(loginHtml);
});

// API de login
app.post('/api/v0/auth/login', express.json(), async (req, res) => {
    const cliente = new Client();
    await cliente.connect();

    const username = req.body.username;
    const password = req.body.password;
    const usuario = await autenticarUsuario(cliente, username, password);

    if(usuario){
        req.session.usuario = usuario;
        res.json({
            success: true,
            usuario: {
                username: usuario.username,
                name: usuario.nombre
            }
        });
    }else{
        res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await cliente.end();
});

// API de logout
/*
app.post('/api/v0/auth/logout', (req, res) => {
     ... 
});
*/


// API de registro
app.post('/api/v0/auth/register', express.json(), async (req, res) => {
    const cliente = new Client();
    await cliente.connect();

    const parametros = req.body;
    console.log(parametros);
    const nuevoUsuario = await crearUsuario(cliente, parametros.username, parametros.password, parametros.nombre, parametros.email);
    console.log(nuevoUsuario);

    if(nuevoUsuario){
        req.session.usuario = nuevoUsuario;
        res.status(201).json({
            success: true,
            usuario: {
                username: nuevoUsuario.username,
                name: nuevoUsuario.nombre
            }
        });
    }else{
        res.status(401).json({ error: 'Datos invalidos' });
    }

    await cliente.end();
});



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
        <p><a href="/app/archivo-json">Subir .csv</a></p>
        <p><a href="/app/alumnos">Ver tabla de alumnos</a></p>
        <p><a href="/app/escribanos">Ver tabla de escribanos</a></p>
        <p><a href="/app/clientes">Ver tabla de clientes</a></p>
        <p><a href="/app/tiposEscritura">Ver tabla de tipos de escrituras</a></p>
    </body>
</html>
`;

app.get('/app/menu', requireAuth, (_, res) => {
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

app.get('/app/lu', requireAuth, (_, res) => {
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

app.get('/app/fecha',requireAuth, (_, res) => {
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

  <!-- Selector de opciones -->
  <label for="opcion">Seleccioná una opción:</label>
  <select id="opcion">
    <option value="">-- Elegí una opción --</option>
    <option value="1" label = "escribanos">Escribanos</option>
    <option value="2" label = "clientes">Clientes</option>
    <option value="3" label = "escrituras">Escrituras</option>
  </select>

  <br><br>

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
      console.log('Llamando handleUpload');
      const fileInput = document.getElementById('csvFile');
      const file = fileInput.files[0];
      if (!file) {
        alert('Por favor seleccioná un archivo CSV.');
        return;
      }
        
      const seleccionar = document.getElementById('opcion');
      const opcionSeleccionada = seleccionar.options[seleccionar.selectedIndex];

      const opcion = opcionSeleccionada.label;
      if (opcion == 0) {
        alert('Por favor seleccioná una opción antes de continuar.');
        return;
      }

      const text = await file.text();
      const jsonData = parseCSV(text);

      const aEnviar = {
        tabla: opcion,   
        data: jsonData 
      };

      try {
        console.log('Llamando al fetch');
        const response = await fetch('../api/v0/alumnos', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(aEnviar)
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

app.get('/app/archivo-json', requireAuth, (_, res) => {
    res.send(HTML_ARCHIVO_JSON)
})


// API DEL BACKEND
var NO_IMPLEMENTADO='<code>ERROR 404 </code> <h1> No implementado aún ⚒<h1>';
export const ERROR = '<code>ERROR 404 </code> <h1> error <h1>';

async function enviarHTML(parametro: string, cliente: Client, generador: Function, res){
    const html = await generador(cliente, parametro);
    res.send(html);
}

async function enviarHTMLLU(cliente: Client, req, res){
    const parametro = req.params.lu;
    await enviarHTML(parametro, cliente, generarCertificadoPorLu, res);
}

async function enviarHTMLFecha(cliente: Client, req, res){
    const parametro = req.params.fecha;
    await enviarHTML(parametro, cliente, generarCertificadoPorFechaServidor, res);
}

async function cargarJSON(cliente: Client, req, res){
    const {tabla, data} = req.body;
    console.log(tabla, data);

    await actualizarTablasJSON(cliente, tabla, data);
    console.log(tabla + " cargados correctamente");
}

async function atenderPedido(respuesta: Function, mensajeError: string, req, res){
    console.log(req.params, req.query, req.body);
    const clientDB = new Client();
    await clientDB.connect();

    try{
        await respuesta(clientDB, req, res);
    }catch(err){
        console.log(mensajeError + ` ${err}`);
        res.status(404).send(ERROR.replace("error", err));
    }finally{
        await clientDB.end();
    }
}

app.get('/api/v0/lu/:lu', requireAuthAPI, async (req, res) => {
    await atenderPedido(enviarHTMLLU, "No se pudo generar el certificado para el alumno", req, res);
})

app.get('/api/v0/fecha/:fecha', requireAuthAPI, async (req, res) => {
    await atenderPedido(enviarHTMLFecha, "No se pudieron generar los certificados", req, res)
})

app.patch('/api/v0/alumnos', requireAuthAPI, async (req, res) => {
    await atenderPedido(cargarJSON, "No se pudieron cargar los alumnos a la tabla", req, res);
})

await generarCRUD(app, "/api/alumnos");

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/login`)
})
