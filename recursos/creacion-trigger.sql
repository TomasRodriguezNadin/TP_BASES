CREATE OR REPLACE FUNCTION tp.eliminar_escrituras_viejas()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tp.escrituras
    WHERE anio <= extract(YEAR FROM CURRENT_DATE) - 10;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER eliminar_escrituras_automaticamente
AFTER INSERT OR UPDATE of anio ON tp.escrituras
FOR EACH STATEMENT
EXECUTE FUNCTION tp.eliminar_escrituras_viejas();