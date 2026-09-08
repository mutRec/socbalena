-- Verificar quantos registres hi ha abans
SELECT 
    'usuaris' as taula, count(*) FROM usuaris
UNION ALL SELECT 'centres', count(*) FROM centres
UNION ALL SELECT 'zones', count(*) FROM zones
UNION ALL SELECT 'immersions', count(*) FROM immersions
UNION ALL SELECT 'media', count(*) FROM media;

-- Eliminar tot
TRUNCATE TABLE media, immersions, zones, centres, usuaris RESTART IDENTITY CASCADE;

-- Verificar que està buit
SELECT 
    'usuaris' as taula, count(*) FROM usuaris
UNION ALL SELECT 'centres', count(*) FROM centres
UNION ALL SELECT 'zones', count(*) FROM zones
UNION ALL SELECT 'immersions', count(*) FROM immersions
UNION ALL SELECT 'media', count(*) FROM media;


TRUNCATE TABLE media, immersions, zones, centres RESTART IDENTITY CASCADE;

COMMIT