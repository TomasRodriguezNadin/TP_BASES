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