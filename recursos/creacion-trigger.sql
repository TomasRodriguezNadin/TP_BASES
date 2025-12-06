CREATE OR REPLACE FUNCTION tp.eliminar_escrituras_viejas()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tp.escrituras
    WHERE anio <= extract(YEAR FROM CURRENT_DATE) - 10;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION TP.verificar_escribano_contratado()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS(
        SELECT 1
        FROM TP.escribanos e
        WHERE e.matricula = NEW.matricula AND e.estado = 'contratado') THEN
            RAISE EXCEPTION 'El escribano % no esta contratado', NEW.matricula;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eliminar_escrituras_automaticamente
AFTER INSERT OR UPDATE of anio ON tp.escrituras
FOR EACH STATEMENT
EXECUTE FUNCTION tp.eliminar_escrituras_viejas();

CREATE TRIGGER verificar_escribano_contratado
BEFORE INSERT OR UPDATE ON TP.escrituras
FOR EACH ROW
EXECUTE FUNCTION TP.verificar_escribano_contratado();

CREATE OR REPLACE FUNCTION tp.eliminar_escribanos_no_contratados()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tp.escribanos
    WHERE matricula NOT IN (
        SELECT matricula
        FROM tp.escribanos 
        WHERE estado = 'contratado'
        UNION 
        (
            SELECT DISTINCT e.matricula
            FROM tp.escribanos e
            INNER JOIN tp.escrituras et ON et.matricula = e.matricula
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eliminar_escribanos_no_contratados_despues_de_borrar_escrituras
AFTER DELETE ON tp.escrituras
FOR EACH STATEMENT
EXECUTE FUNCTION tp.eliminar_escribanos_no_contratados();

CREATE OR REPLACE TRIGGER eliminar_escribanos_no_contratados_despues_de_insertar_escribanos
AFTER INSERT OR UPDATE ON tp.escribanos
FOR EACH STATEMENT
EXECUTE FUNCTION tp.eliminar_escribanos_no_contratados();


CREATE OR REPLACE FUNCTION tp.verificar_experiencia_escritura()
RETURNS TRIGGER AS $$
DECLARE
    experiencia_esc experiencia;
    experiencia_req experiencia;
BEGIN
    SELECT e.capacidad
    INTO experiencia_esc
    FROM tp.escribanos e
    WHERE e.matricula = NEW.matricula;

    SELECT t.experiencia_requerida
    INTO experiencia_req
    FROM tp.tipo_escrituras t
    WHERE t.id_tipo = NEW.id_tipo;

    IF experiencia_esc < experiencia_req THEN
        RAISE EXCEPTION
            'El escribano % no tiene la capacidad necesaria para realizar la escritura de id %',
            NEW.matricula, NEW.id_tipo;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_verificar_experiencia_escritura
BEFORE INSERT OR UPDATE ON tp.escrituras
FOR EACH ROW
EXECUTE FUNCTION tp.verificar_experiencia_escritura();