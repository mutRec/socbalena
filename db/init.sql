-- SócBalena — Schema inicial
-- Executat automàticament per Docker en primer inici

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Usuaris
CREATE TABLE usuaris (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'bussejador' CHECK (rol IN ('admin','bussejador')),
  avatar_url TEXT,
  creat_a TIMESTAMPTZ DEFAULT NOW()
);

-- Centres de busseig
CREATE TABLE centres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(150) NOT NULL,
  pais VARCHAR(100),
  regio VARCHAR(100),
  adreca TEXT,
  telefon VARCHAR(50),
  email VARCHAR(255),
  web VARCHAR(255),
  notes TEXT,
  creat_a TIMESTAMPTZ DEFAULT NOW()
);

-- Zones de busseig (llocs/spots)
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(150) NOT NULL,
  centre_id UUID REFERENCES centres(id) ON DELETE SET NULL,
  pais VARCHAR(100),
  regio VARCHAR(100),
  latitud NUMERIC(10,6),
  longitud NUMERIC(10,6),
  tipus VARCHAR(50) CHECK (tipus IN ('escull','paret','cova','derelicte','platja','llac','riu','altre')),
  nivell_dificultat VARCHAR(20) CHECK (nivell_dificultat IN ('principiant','intermedi','avançat','expert')),
  profunditat_max NUMERIC(5,1),
  descripcio TEXT,
  notes TEXT,
  creat_a TIMESTAMPTZ DEFAULT NOW()
);

-- Immersions
CREATE TABLE immersions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuari_id UUID NOT NULL REFERENCES usuaris(id) ON DELETE CASCADE,
  numero_immersio INTEGER,
  data DATE NOT NULL,
  hora_entrada TIME,
  hora_sortida TIME,
  zona_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  centre_id UUID REFERENCES centres(id) ON DELETE SET NULL,
  -- Paràmetres tècnics
  profunditat_max NUMERIC(5,1),
  profunditat_mitja NUMERIC(5,1),
  temps_fons INTEGER,        -- minuts
  temps_superficie INTEGER,  -- minuts entre immersions
  pressio_entrada INTEGER,   -- bar
  pressio_sortida INTEGER,   -- bar
  consum_aire INTEGER,       -- litres
  capacitat_bombona INTEGER, -- litres
  tipus_gas VARCHAR(50) DEFAULT 'Aire',
  -- Condicions
  visibilitat VARCHAR(20) CHECK (visibilitat IN ('excel·lent','bona','moderada','dolenta','nul·la')),
  corrent VARCHAR(20) CHECK (corrent IN ('cap','feble','moderat','fort','molt fort')),
  onatge VARCHAR(20) CHECK (onatge IN ('pla','lleuger','moderat','fort')),
  temp_aigua NUMERIC(4,1),
  temp_aire NUMERIC(4,1),
  -- Equipament
  tipus_vestit VARCHAR(50) CHECK (tipus_vestit IN ('sec','semisec','humit_5mm','humit_3mm','rashguard','altre')),
  pes_llastre NUMERIC(4,1),  -- kg
  -- Logística
  company TEXT,
  instructor TEXT,
  tipus_immersio VARCHAR(50) CHECK (tipus_immersio IN ('recreativa','formació','tècnica','fotografia','noctorna','decompressió','altra')),
  valoracio INTEGER CHECK (valoracio BETWEEN 1 AND 5),
  notes TEXT,
  creat_a TIMESTAMPTZ DEFAULT NOW(),
  actualitzat_a TIMESTAMPTZ DEFAULT NOW()
);

-- Índex per usuari i data
CREATE INDEX idx_immersions_usuari ON immersions(usuari_id);
CREATE INDEX idx_immersions_data ON immersions(data DESC);

-- Fotos i mini-vídeos
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  immersio_id UUID NOT NULL REFERENCES immersions(id) ON DELETE CASCADE,
  usuari_id UUID NOT NULL REFERENCES usuaris(id) ON DELETE CASCADE,
  tipus VARCHAR(10) CHECK (tipus IN ('foto','video')),
  nom_fitxer VARCHAR(255) NOT NULL,
  nom_original VARCHAR(255),
  mida_bytes INTEGER,
  amplada INTEGER,
  alcada INTEGER,
  durada_seg NUMERIC(6,1),  -- per vídeos
  descripcio TEXT,
  es_portada BOOLEAN DEFAULT FALSE,
  creat_a TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_immersio ON media(immersio_id);

-- Funció per actualitzar timestamp
CREATE OR REPLACE FUNCTION update_actualitzat_a()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualitzat_a = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_immersions_updated
  BEFORE UPDATE ON immersions
  FOR EACH ROW EXECUTE FUNCTION update_actualitzat_a();

-- Dades de demo (usuari admin)
-- Password: Demo1234! (bcrypt hash)
INSERT INTO usuaris (nom, email, password_hash, rol) VALUES
  ('Admin SócBalena', 'admin@socbalena.cat', '$2b$10$rQ8K1aZFjKp3t5mVXn7Y.uOQvW2kRmTpZoNl1xXhEbCdAfGiHjKs2', 'admin');

-- Centres de demo
INSERT INTO centres (nom, pais, regio, notes) VALUES
  ('Posidònia Diving', 'Espanya', 'Costa Brava', 'Centre referent a l''Empordà'),
  ('Illes Medes Sub', 'Espanya', 'L''Estartit', 'Accés directe a les Illes Medes'),
  ('Mallorca Blue Depths', 'Espanya', 'Illes Balears', 'Especialitzats en coves');

-- Zones de demo
INSERT INTO zones (nom, pais, regio, tipus, nivell_dificultat, profunditat_max, descripcio) VALUES
  ('Illes Medes – El Medallot', 'Espanya', 'L''Estartit', 'escull', 'intermedi', 42, 'Una de les immersions més espectaculars de la Costa Brava. Gran varietat de fauna.'),
  ('Cap de Creus – La Galera', 'Espanya', 'Costa Brava', 'paret', 'avançat', 55, 'Paret vertical amb gorgònies i corall vermell.'),
  ('Dragonera – El Lladoner', 'Espanya', 'Illes Balears', 'escull', 'principiant', 18, 'Excel·lent per a iniciació. Aigües cristal·lines.');
