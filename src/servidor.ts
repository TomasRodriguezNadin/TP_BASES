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
import { login_html, menu_html, subir_csv, plantilla_pedir_escritura} from "./constantes.js";

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
    const nuevoUsuario = await crearUsuario(cliente, parametros.username, parametros.password, parametros.nombre, parametros.email);

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

app.get('/app/menu', requireAuth, (_, res: Response) => {
    const HTML_MENU = fs.readFileSync(menu_html, 'utf8');
    res.send(HTML_MENU);
})

function generarMenuEscrituras(parametros: Record<string, string>[], caso: string): string{
    let html = fs.readFileSync(plantilla_pedir_escritura, 'utf8');;
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


app.get('/app/subir-csv', requireAuth, (_, res: Response) => {
    const HTML_SUBIR_CSV = fs.readFileSync(subir_csv, 'utf8');
    
    res.send(HTML_SUBIR_CSV);
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

async function cargarJSON(cliente: Client, req: Request, res: Response){
    const {tabla, data} = req.body;
    
    await actualizarTablasJSON(cliente, tabla, data);
    res.json("OK");
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
