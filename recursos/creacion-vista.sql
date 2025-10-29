CREATE VIEW tp.datos_escritura AS
    SELECT est.matricula, est.nro_protocolo, est.anio, esb.nombre_escribano, esb.apellido_escribano, c.nombre, c.apellido, c.cuit, t.tipo FROM 
    tp.escrituras est
    INNER JOIN tp.escribanos esb ON est.matricula = esb.matricula
    INNER JOIN tp.clientes c ON est.cuit = c.cuit
    INNER JOIN tp.tipo_escrituras t ON est.id_tipo = t.id_tipo