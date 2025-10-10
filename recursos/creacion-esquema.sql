SET ROLE TO tp_owner;
CREATE SCHEMA tp;
GRANT USAGE ON SCHEMA TP TO administrador;

CREATE TYPE experiencia AS ENUM ('principiante', 'mediano', 'experimentado');

CREATE TABLE TP.escribanos (
    matricula INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    capacidad experiencia NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escribanos to administrador;

CREATE TABLE TP.clientes (
    cuit INT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.clientes to administrador;

CREATE TABLE TP.tipoEscrituras (
    idTipo INT PRIMARY KEY,
    tipo TEXT,
    experienciaRequerida experiencia NOT NULL
);

grant SELECT, INSERT, UPDATE, DELETE on TP.tipoEscrituras to administrador;

CREATE TABLE TP.escrituras (
    matricula INT PRIMARY KEY
    nroProtocolo INT,
    anio INT,
    idTipo INT,
    cuit INT,
    PRIMARY KEY (matricula, nroProtocolo, anio),
    FOREIGN KEY (matricula) REFERENCES TP.escribanos(matricula),
    FOREIGN KEY (idTipo) REFERENCES TP.tipoEscrituras(idTipo),
    FOREIGN KEY (cuit) REFERENCES TP.clientes(cuit)
);

grant SELECT, INSERT, UPDATE, DELETE on TP.escrituras to administrador;
