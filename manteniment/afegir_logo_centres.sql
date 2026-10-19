-- Afegeix la columna logo_url a la taula centres (logotip del centre de busseig)
-- El backend també aplica aquesta migració automàticament en arrencar, així que
-- aquest script només cal si vols fer-ho manualment.
--
-- Execució:
--   docker exec socbalena_db psql -U socbalena -d socbalena -f /tmp/afegir_logo_centres.sql

ALTER TABLE centres ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Comprovació
SELECT id, nom, logo_url FROM centres ORDER BY nom;
