SET ROLE TO tp_owner;
CREATE SCHEMA tp;
GRANT USAGE ON SCHEMA TP TO administrador;

CREATE TYPE experiencia AS ENUM ('principiante', 'mediano', 'experimentado');

CREATE TYPE estado AS ENUM ('contratado', 'no contratado');


CREATE TABLE TP.escribanos (
    matricula INT PRIMARY KEY,
    nombre_escribano TEXT NOT NULL,
    apellido_escribano TEXT NOT NULL,
    capacidad experiencia NOT NULL,
    estado estado DEFAULT 'contratado',
    CONSTRAINT matricula_valida CHECK (matricula > 0)
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escribanos to administrador;

CREATE TABLE TP.clientes (
    cuit CHAR(11) PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    CONSTRAINT cuit_formato CHECK (cuit ~ '^[0-9]{11}$')
);

grant SELECT, INSERT, UPDATE, DELETE on TP.clientes to administrador;

CREATE TABLE TP.tipo_escrituras (
    id_tipo INT PRIMARY KEY,
    tipo TEXT,
    experiencia_requerida experiencia NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.tipo_escrituras to administrador;

CREATE TABLE TP.escrituras (
    matricula INT,
    nro_protocolo INT,
    anio INT,
    id_tipo INT,
    cuit CHAR(11),
    PRIMARY KEY (matricula, nro_protocolo, anio),
    FOREIGN KEY (matricula) REFERENCES TP.escribanos(matricula),
    FOREIGN KEY (id_tipo) REFERENCES TP.tipo_escrituras(id_tipo),
    FOREIGN KEY (cuit) REFERENCES TP.clientes(cuit),
    CONSTRAINT anio_valido CHECK (
    anio BETWEEN EXTRACT(YEAR FROM CURRENT_DATE) - 10 AND EXTRACT(YEAR FROM CURRENT_DATE)),
    CONSTRAINT nro_protocolo_valido CHECK (nro_protocolo > 0)
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escrituras to administrador;
