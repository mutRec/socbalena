-- Permet associar una zona de busseig a diversos centres.
-- El backend també aplica aquesta migració automàticament en arrencar, així que
-- aquest script només cal si vols fer-ho manualment.
--
-- Execució:
--   docker exec socbalena_db psql -U socbalena -d socbalena -f /tmp/zona_centres_many_to_many.sql

CREATE TABLE IF NOT EXISTS zona_centres (
  zona_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
  PRIMARY KEY (zona_id, centre_id)
);

CREATE INDEX IF NOT EXISTS idx_zona_centres_centre ON zona_centres(centre_id);

-- Migra les associacions existents (zones.centre_id) i elimina la columna antiga
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'zones' AND column_name = 'centre_id'
  ) THEN
    INSERT INTO zona_centres (zona_id, centre_id)
    SELECT id, centre_id FROM zones WHERE centre_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    ALTER TABLE zones DROP COLUMN centre_id;
  END IF;
END $$;

-- Comprovació
SELECT z.nom AS zona, COALESCE(string_agg(c.nom, ', ' ORDER BY c.nom), '—') AS centres
FROM zones z
LEFT JOIN zona_centres zc ON zc.zona_id = z.id
LEFT JOIN centres c ON c.id = zc.centre_id
GROUP BY z.id, z.nom
ORDER BY z.nom;
