SET ROLE TO tp_owner;
CREATE SCHEMA tp;
GRANT USAGE ON SCHEMA TP TO administrador;

CREATE TYPE experiencia AS ENUM ('principiante', 'mediano', 'experimentado');

CREATE TABLE TP.escribanos (
    matricula INT PRIMARY KEY,
    nombre_escribano TEXT NOT NULL,
    apellido TEXT NOT NULL,
    capacidad experiencia NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escribanos to administrador;

CREATE TABLE TP.clientes (
    cuit BIGINT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.clientes to administrador;

CREATE TABLE TP.tipo_escrituras (
    id_tipo INT PRIMARY KEY,
    tipo TEXT,
    experiencia_requerida experiencia NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.tipoEscrituras to administrador;

CREATE TABLE TP.escrituras (
    matricula INT,
    nro_protocolo INT,
    anio INT,
    idTipo INT,
    cuit BIGINT,
    PRIMARY KEY (matricula, nroProtocolo, anio),
    FOREIGN KEY (matricula) REFERENCES TP.escribanos(matricula),
    FOREIGN KEY (idTipo) REFERENCES TP.tipoEscrituras(idTipo),
    FOREIGN KEY (cuit) REFERENCES TP.clientes(cuit)
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escrituras to administrador;
