CREATE USER TP_owner nologin;
CREATE USER administrador PASSWORD 'temporal';

CREATE DATABASE TP owner TP_owner;
GRANT CONNECT ON DATABASE TP to TP_owner;