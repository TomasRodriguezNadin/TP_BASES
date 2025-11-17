import express from "express";
import { Client } from 'pg';
import dotenv from "dotenv";
import { pedirEscrituras} from './acciones/generacionCertificados.js';
import {actualizarTablasJSON} from "./acciones/accionesSQL.js";
import { generarCRUD } from "./crud.js";
import session from 'express-session';
import { autenticarUsuario, crearUsuario } from './auth.js';
import type { Usuario } from "./auth.js";
import type { Request, Response, NextFunction } from "express"; 
import * as fs from 'fs';
import { crearCliente } from "./acciones/coneccion.js";
import { login_html } from "./constantes.js";

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
    const loginHtml = fs.readFileSync(login_html, 'utf8');
    res.send(loginHtml);
});

// API de login
app.post('/api/v0/auth/login', express.json(), async (req: Request, res: Response) => {
    const cliente = await crearCliente();

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
app.post('/api/v0/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
        if (err) {
            return res.status(500).json({ error: 'Error al cerrar sesión' });
        }
        return res.json({ success: true });
    });
});


// API de registro
app.post('/api/v0/auth/register', express.json(), async (req: Request, res: Response) => {
    const cliente = await crearCliente();

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
        <h1>Escribania</h1>
        <p>menu</p>
        <p><a href="/app/escritura">Solicitar escritura</a></p>
        <p><a href="/app/escriturasEscribano">Solicitar escrituras por escribano</a></p>
        <p><a href="/app/escriturasCliente">Solicitar escrituras por cliente</a></p>
        <p><a href="/app/archivo-json">Subir .csv</a></p>
        <p><a href="/app/escribanos">Ver tabla de escribanos</a></p>
        <p><a href="/app/clientes">Ver tabla de clientes</a></p>
        <p><a href="/app/tipo_escrituras">Ver tabla de tipos de escrituras</a></p>
        <p><a href="/app/escrituras">Ver tabla de escrituras</a></p>
    </body>
</html>
`;

app.get('/app/menu', requireAuth, (_, res: Response) => {
    res.send(HTML_MENU)
})

const HTML_PEDIR_ESCRITURA=
`<!doctype html>
<html>
    <head>
        <meta charset="utf8">
    </head>
    <body>
        <div>Obtener escritura</div>
        #[labels]
        <button id="btnEnviar">Pedir Escritura</button>
        <script>
            window.onload = function() {
                document.getElementById("btnEnviar").onclick = function() {
                    #[vars]
                    window.location.href = "../api/v0/escritura#[Caso]" #[uri] ;
                }
            }
        </script>
    </body>
</html>
`;

function generarMenuEscrituras(parametros: Record<string, string>[], caso: string): string{
    let html = HTML_PEDIR_ESCRITURA;
    let labels = "";
    let variables = "";
    let uriComponents = "";

    for (const parametro of parametros){
        labels += `<div><label>${parametro.titulo}: <input name=${parametro.atributo}></label></div>`;
        variables += `const ${parametro.atributo} = document.getElementsByName("${parametro.atributo}")[0].value;`;
        uriComponents += `+ "/" + encodeURIComponent(${parametro.atributo})`; 
    }

    html = html.replace("#[labels]", labels);
    html = html.replace("#[vars]", variables);
    html = html.replace("#[uri]", uriComponents);
    html = html.replace("#[Caso]", caso)

    return html;
}

app.get('/app/escritura', requireAuth, (_, res: Response) => {
    const parametros = [
        {titulo: "Matricula", atributo: "matricula"},
        {titulo: "Numero de Protocolo", atributo: "nroProtocolo"},
        {titulo: "Año", atributo: "anio"}
    ];

    const html = generarMenuEscrituras(parametros, "");
    
    res.send(html);
})

app.get('/app/escriturasEscribano', requireAuth, (_, res: Response) => {
    const parametros = [
        {titulo: "Matricula", atributo: "matricula"},
    ];

    const html = generarMenuEscrituras(parametros, "");
    
    res.send(html);
})

app.get('/app/escriturasCliente', requireAuth, (_, res: Response) => {
    const parametros = [
        {titulo: "CUIT", atributo: "cuit"},
    ];

    const html = generarMenuEscrituras(parametros, "Cliente");
    
    res.send(html);
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
        const response = await fetch('../api/csv', {
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

app.get('/app/archivo-json', requireAuth, (_, res: Response) => {
    res.send(HTML_ARCHIVO_JSON)
})


// API DEL BACKEND
const ERROR = '<code>ERROR 404 </code> <h1> error <h1>';

async function enviarHTMLEscritura(cliente: Client, req: Request, res: Response){
    const html = await pedirEscrituras(cliente, req.params);
    res.send(html[0]);
}

async function enviarHTMLEscrituras(cliente: Client, req: Request, res: Response){
    const html = await pedirEscrituras(cliente, req.params);
    res.send(html.join(`\n`));
}

async function cargarJSON(cliente: Client, req: Request, _: Response){
    const {tabla, data} = req.body;
    console.log(tabla, data);

    await actualizarTablasJSON(cliente, tabla, data);
    console.log(tabla + " cargados correctamente");
}

async function atenderPedido(respuesta: Function, mensajeError: string, req: Request, res: Response){
    console.log(req.params, req.query, req.body);
    const clientDB = await crearCliente();

    try{
        await respuesta(clientDB, req, res);
    }catch(err){
        console.log(mensajeError + ` ${err}`);
        res.status(404).send(ERROR.replace("error", err as string));
    }finally{
        await clientDB.end();
    }
}

app.patch('/api/csv', requireAuthAPI, async (req: Request, res: Response) => {
    await atenderPedido(cargarJSON, "No se pudieron cargar los datos a la tabla", req, res);
})

app.get('/api/v0/escritura/:matricula/:nro_Protocolo/:anio', requireAuthAPI, async (req, res) => {
    await atenderPedido(enviarHTMLEscritura, "No se pudo generar la escritura", req, res);
})

app.get('/api/v0/escritura/:matricula', requireAuthAPI, async (req: Request, res: Response) => {
    await atenderPedido(enviarHTMLEscrituras, "No se pudo generar la escritura", req, res);
})

app.get('/api/v0/escrituraCliente/:cuit', requireAuthAPI, async (req: Request, res: Response) => {
    await atenderPedido(enviarHTMLEscrituras, "No se pudo generar la escritura", req, res);
})

await generarCRUD(app);

app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}/app/login`)
})

app.get('/', requireAuth, async (_: Request, res: Response) => {
    res.redirect('/app/menu');
})
