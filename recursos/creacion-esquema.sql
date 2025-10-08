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
grant SELECT, INSERT, UPDATE, DELETE on TP.usuarios to administrador;
GRANT USAGE, SELECT ON SEQUENCE tp.usuarios_id_seq TO administrador;
GRANT UPDATE ON SEQUENCE tp.usuarios_id_seq TO administrador;