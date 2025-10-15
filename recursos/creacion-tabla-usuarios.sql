CREATE TABLE tp.usuarios (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT,
    email TEXT
);

grant SELECT, INSERT, UPDATE, DELETE on TP.usuarios to administrador;
GRANT USAGE, SELECT ON SEQUENCE tp.usuarios_id_seq TO administrador;
GRANT UPDATE ON SEQUENCE tp.usuarios_id_seq TO administrador;