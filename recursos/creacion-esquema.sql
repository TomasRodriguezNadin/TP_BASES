SET ROLE TO tp_owner;
CREATE SCHEMA tp;
GRANT USAGE ON SCHEMA TP TO administrador;

CREATE TABLE TP.alumnos (
    lu TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    titulo TEXT NOT NULL,
    titulo_en_tramite TEXT,
    egreso date
);

grant SELECT, INSERT, UPDATE, DELETE on TP.alumnos to administrador;
