# Documentacion para usar Escribania s.a.

## Set up
Desde postgresql, correr los scripts de sql de la carpeta "recursos/" en el orden:
- creacion-db.sql
- creacion-esquema.sql
- creacion-tabla-usuarios.sql
- creacion-vista.sql
- creacion-trigger.sql
Modificando los nombres y variables que quiera.

Una vez hecho esto, crear un archivo .env en el directorio root del proyecto con las variables

PGUSER=administrador

PGPASSWORD=su_contraseña

PGHOST=su_host

PGPORT=su_port

PGDATABASE=nombre_de_la_base_de_datos

DATABASE_URL=postgresql://administrador.zlzzbblcbtijtsjqqipd:temporal@aws-1-us-east-1.pooler.supabase.com:6543/postgres

DB=Local o Produccion segun si quiere acceder a la base de datos local o de render

## Ejecución
Desde el directorio root del proyecto pueden correr:
- npm run servidor
- npm run cli
Segun si se quiere usar la pagina o el cli.

## Detalles del sistema
El sistema esta compuesto por escribanos, clientes y escrituras, tipos de escrituras.

Los escribanos se identifican por sus matrículas, los clientes por sus CUIL, las escrituras por la matrícula del escribano que las hizo, numero de protocolo y año en el que se hicieron, los tipos de escritura por un id asignado.

Guardamos las escrituras por diez años y luego las borramos del sistema. Como debemos saber qué escribano hizo una escritura, mientras guardemos las escrituras de un escribano, este estará en nuestro sistema, aclarando si está o no contratado
y una vez no quedan escrituras de un escribano no contratado lo eliminamos del sistema. Solo podemos asignarle una escritura a un escribano contratado.

## Uso del servidor
Una vez corremos npm run servidor, se escribe un link en la terminal para acceder a este.

Una vez entramos a ese link, tenemos 2 opciones:
- Pedir una escritura
- Acceder a una tabla

Podemos pedir una escritura por sus identificadores, las de un escribano por su matrícula o las de un cliente por su CUIL. En cuyo caso se generarán las escrituras y se podrán ver.

Al acceder a una tabla, se nos mostrarán todos sus elementos (por ejemplo todos los escribanos) y podremos agregar nuevos elementos, editarlos, eliminarlos y ordenarlos.

## Uso del cli
Desde la carpeta base/entrada en el root del servidor, hay que escribir un archivo "generacion_certificados.csv" con los comandos y parametros que le debemos pasar.

Los comandos son:
- archivo
- escritura

En el caso de archivo pasamos 2 parámetros: qué elementos queremos agregar (clientes, escribanos, escrituras, tipo_escrituras) y el archivo csv donde guardamos todos los elementos que queremos agregar. Este archivo debe guardar primero los atributos
de cada elemento en el orden en que se van a escribir en el archivo y luego los atributos de cada elemento agregado.

En el caso de escritura le pasamos los 3 identificadores de la escritura: matricula del escribano, numero de protocolo y año en ese orden.
