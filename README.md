# SócBalena — Diari de busseig personal

Aplicació web fullstack per gestionar el teu historial d'immersions de busseig recreatiu. Amb fitxes imprimibles i galeria de fotos i vídeos.

## Característiques

- **Immersions**: Registra tots els paràmetres de cada immersió (profunditat, temps, pressió, condicions, equipament...)
- **Fitxa imprimible**: Cada immersió té una fitxa que pots imprimir o exportar a PDF
- **Galeria multimèdia**: Puja fotos i mini-vídeos per cada immersió, descarrega'ls, estableix portada
- **Centres de busseig**: Directori de centres amb les seves zones associades i comptador d'immersions
- **Zones de busseig**: Mapa de spots amb tipus, dificultat, coordenades i descripció
- **Dashboard**: Resum d'últimes immersions i accions ràpides
- **Autenticació JWT**: Sistema multi-usuari amb sessions segures (token de 7 dies)
- **Disseny submarí**: Interfície en blau abissal amb accents cian fosforescent, responsive

## Stack tecnològic

| Capa | Tecnologia |
|------|-----------|
| Backend | Node.js 20 + Express 4 |
| Base de dades | PostgreSQL 16 (Alpine) |
| Frontend | Vanilla JS (ES Modules, SPA hash routing) |
| Servidor web | Nginx (Alpine) |
| Contenidors | Docker + Docker Compose 3.9 |
| Autenticació | JWT (jsonwebtoken) + bcryptjs |
| Uploads | Multer + Sharp (metadades fotos) |
| PDF | html2pdf.js (CDN) |
| CSS | Disseny custom sense frameworks |

## Estructura del projecte

```
socbalena/
├── docker-compose.yml          ← Orquestració de serveis
├── .env.example                ← Plantilla variables d'entorn
├── .gitignore
├── README.md
├── db/
│   └── init.sql                ← Esquema PostgreSQL + triggers + dades demo
├── backend/
│   ├── Dockerfile              ← Node 20 Alpine + vips per Sharp
│   ├── package.json
│   ├── server.js               ← Express app, middlewares, rutes
│   ├── db/
│   │   └── pool.js             ← Connexió PostgreSQL (Pool, max 10)
│   ├── middleware/
│   │   └── auth.js             ← JWT authMiddleware + adminOnly
│   └── routes/
│       ├── auth.js             ← POST login, GET perfil
│       ├── immersions.js       ← CRUD complet amb JOINs i paginació
│       ├── centres.js          ← CRUD centres + comptador zones
│       ├── zones.js            ← CRUD zones + comptador immersions
│       └── media.js            ← Upload Multer, portada, delete fitxer
├── frontend/
│   ├── index.html              ← Shell SPA, nav, topbar
│   ├── css/
│   │   ├── main.css            ← Sistema de disseny complet (variables, cards, forms)
│   │   └── print.css           ← Estils d'impressió per fitxes
│   └── js/
│       ├── app.js              ← Router SPA hash + estat global (store)
│       ├── api.js              ← Client HTTP amb JWT automàtic
│       └── views/
│           ├── login.js        ← Formulari login
│           ├── inici.js        ← Dashboard amb darreres immersions
│           ├── immersions.js   ← Llista paginada + filtre + formulari creació/edició
│           ├── immersio-modal.js ← Modal compartit crear/editar immersió
│           ├── immersio-detall.js ← Fitxa detallada + galeria media
│           ├── centres.js      ← Llista i gestió de centres
│           ├── centre-modal.js ← Modal compartit crear/editar centre
│           ├── centre-detall.js ← Fitxa del centre + zones associades
│           ├── zones.js        ← Llista i gestió de zones
│           ├── zone-modal.js   ← Modal compartit crear/editar zona (diversos centres)
│           ├── zone-detall.js  ← Fitxa de la zona + immersions
│           └── perfil.js       ← Perfil d'usuari
├── nginx/
│   ├── Dockerfile              ← Nginx Alpine
│   └── nginx.conf              ← SPA routing + proxy API + cache uploads
└── manteniment/
    ├── crearUsuariApp.sql      ← Script creació nous usuaris
    ├── inserts_immersions.sql  ← Inserció massiva d'immersions
    ├── purgar_dades_taules.sql ← Neteja de taules
    ├── zona_centres_many_to_many.sql ← Migració zona ↔ diversos centres
    ├── immersions_backup.dump  ← Backup PostgreSQL (format custom)
    └── info-backup-bbdd.txt    ← Instruccions backup/restore
```

## Esquema de base de dades

```
usuaris (UUID PK)
  · nom, email (unique), password_hash, rol, avatar_url
  │
  ├──< immersions (UUID PK)
  │      · data, numero_immersio, zona_id, centre_id
  │      · profunditat_max/mitja, temps_fons, pressió
  │      · visibilitat, corrent, onatge, temperatura
  │      · tipus_vestit, company, instructor, valoracio, notes
  │      │
  │      └──< media (UUID PK)
  │             · tipus (foto/video), nom_fitxer, descripcio
  │             · es_portada, mida_bytes, amplada, alcada, durada_seg
  │
centres (UUID PK) ──< zona_centres >── zones (UUID PK)
  · nom, pais, regio        · zona_id       · nom, pais, regio
  · telefon, email, web     · centre_id     · latitud, longitud, tipus
  · logo_url, notes                         · nivell, profunditat_max
                                            · descripcio, notes
```

**Triggers**: `tr_immersions_updated` actualitza `actualitzat_a` automàticament.

## Posada en marxa

### Requisits previs

- Docker >= 24
- Docker Compose >= 2

### 1. Clonar i configurar

```bash
git clone <repo> socbalena
cd socbalena

# Copiar i editar variables d'entorn
cp .env.example .env
nano .env   # Canvia els passwords!
```

### Variables d'entorn

| Variable | Descripció | Per defecte |
|----------|-----------|-------------|
| `POSTGRES_DB` | Nom de la base de dades | `socbalena` |
| `POSTGRES_USER` | Usuari PostgreSQL | `socbalena` |
| `POSTGRES_PASSWORD` | Contrasenya PostgreSQL | `socbalena_secret` |
| `JWT_SECRET` | Secret per signar tokens JWT | `canvia_aquest_secret_en_produccio` |
| `NODE_ENV` | Mode de l'aplicació | `development` |

### 2. Arrancar

```bash
docker compose up -d --build
```

Espera uns 30 segons perquè PostgreSQL inicialitzi l'esquema i les dades demo.

### 3. Accedir

| Servei | URL |
|--------|-----|
| Aplicació web | http://localhost:8085 |
| API Backend | http://localhost:3002 |
| API Health Check | http://localhost:3002/api/health |
| PostgreSQL | localhost:5432 |

### Primer accés

L'esquema (`db/init.sql`) crea un usuari de demo `admin@socbalena.cat`, però **sense cap contrasenya utilitzable**. Abans de poder entrar-hi cal assignar-n'hi una; el més pràctic és crear un usuari nou o posar contrasenya a l'existent amb l'script de manteniment.

👉 Consulta **[Crear un usuari nou](#crear-un-usuari-nou)**.

> En producció, canvia sempre les contrasenyes dels usuaris que creïs.

## API Reference

Totes les rutes (excepte login) requereixen header `Authorization: Bearer <token>`.

### Autenticació

```
POST /api/auth/login
  Body: { email, password }
  Resposta: { token, usuari: { id, nom, email, rol, avatar_url } }

GET  /api/auth/perfil
  Resposta: { id, nom, email, rol, avatar_url, creat_a }

POST /api/auth/avatar
  Body: multipart/form-data { avatar }
  Resposta: { avatar_url }
  Nota: la imatge es retalla en quadrat i s'escala a 400x400. Màx. 10 MB.

DELETE /api/auth/avatar
  Resposta: 204 No Content
```

### Immersions

```
GET    /api/immersions
  Query: ?page=1&limit=20&zona_id=<uuid>&any=2024&q=<text>
  Resposta: { total, pagina, immersions: [...] }
  Nota: q cerca per nom de zona, número d'immersió o data (DD/MM/YYYY o YYYY-MM-DD)

GET    /api/immersions/opcions
  Resposta: llista lleugera [{ id, numero_immersio, data, zona_nom }]
            per al selector de navegació ràpida

GET    /api/immersions/:id
  Resposta: immersió completa + media: [...]

POST   /api/immersions
  Body: { data, zona_id?, centre_id?, profunditat_max?, temps_fons?, ... }
  Resposta: immersió creada

PUT    /api/immersions/:id
  Body: camps a actualitzar
  Resposta: immersió actualitzada

DELETE /api/immersions/:id
  Resposta: 204 No Content
```

### Centres

```
GET    /api/centres
  Resposta: llista amb num_zones (comptador)

GET    /api/centres/:id
  Resposta: centre + zones: [...]

POST   /api/centres
  Body: { nom, pais?, regio?, adreca?, telefon?, email?, web?, notes? }

PUT    /api/centres/:id
DELETE /api/centres/:id
```

### Zones

```
GET    /api/zones
  Resposta: llista amb centres: [{ id, nom }] + num_immersions de l'usuari

GET    /api/zones/:id
  Resposta: zona completa + centres: [{ id, nom }]
            + immersions de l'usuari: [{ id, numero_immersio, data }]

POST   /api/zones
  Body: { nom, centre_ids?: [uuid], pais?, regio?, latitud?, longitud?,
          tipus?, nivell_dificultat?, profunditat_max?, descripcio?, notes? }

PUT    /api/zones/:id
  Body: igual que POST (substitueix els centres associats)
DELETE /api/zones/:id
```

**Valors permesos:**
- `tipus`: escull, paret, cova, derelicte, platja, llac, riu, altres
- `nivell_dificultat`: principiant, intermedi, avançat, expert

### Media (fotos i vídeos)

```
POST   /api/media/:immersio_id
  Body: multipart/form-data { fitxer, descripcio? }
  Límit: 50 MB
  Tipus permesos: JPEG, PNG, WebP, HEIC, MP4, MOV, WebM

PATCH  /api/media/:id/portada
  Resposta: { ok: true }

PATCH  /api/media/:id
  Body: { descripcio? }

DELETE /api/media/:id
  Resposta: 204 No Content (elimina fitxer físic)
```

Els fitxers pujats es serveixen a `/uploads/<usuari_id>/<fitxer>`.

## Base de dades

### Taules

| Taules | Descripció |
|--------|-----------|
| `usuaris` | Usuaris amb autenticació bcrypt |
| `centres` | Directori de centres de busseig |
| `zones` | Spots de busseig amb coordenades i metadades |
| `zona_centres` | Associació N:M entre zones i centres |
| `immersions` | Registres d'immersions (27 camps tècnics) |
| `media` | Fotos i vídeos associats a immersions |

### Índexs

- `idx_immersions_usuari` — Cerques ràpides per usuari
- `idx_immersions_data` — Ordenació per data DESC
- `idx_media_immersio` — Cerques ràpides per immersió

## Comandes útils

```bash
# Arrancar
docker compose up -d --build

# Aturar
docker compose down

# Aturar i esborrar dades (irreversible)
docker compose down -v

# Veure logs backend
docker compose logs -f backend

# Veure logs tots els serveis
docker compose logs -f

# Accedir a PostgreSQL
docker compose exec db psql -U socbalena -d socbalena

# Backup de la base de dades (format custom)
docker exec socbalena_db pg_dump -U socbalena -d socbalena -F c > immersions_backup.dump

# Restaurar backup
docker cp immersions_backup.dump socbalena_db:/tmp/immersions_backup.dump
docker exec socbalena_db pg_restore -U socbalena -d socbalena --clean --if-exists /tmp/immersions_backup.dump

# Recrear BD completa (destruir + recrear + restaurar)
docker exec socbalena_db dropdb -U socbalena socbalena
docker exec socbalena_db createdb -U socbalena socbalena
docker cp immersions_backup.dump socbalena_db:/tmp/immersions_backup.dump
docker exec socbalena_db pg_restore -U socbalena -d socbalena /tmp/immersions_backup.dump

# Verificar contingut media
docker exec socbalena_db psql -U socbalena -d socbalena -c "SELECT id, immersio_id, nom_fitxer, nom_original FROM media LIMIT 10;"

# Reconstruir sense cache
docker compose up -d --build --force-recreate
```

## Manteniment

El directori `manteniment/` conté scripts SQL per tasques administratives:

| Fitxer | Descripció |
|--------|-----------|
| `crearUsuariApp.sql` | Script per crear nous usuaris amb hash bcrypt |
| `inserts_immersions.sql` | Inserció massiva d'immersions de prova |
| `purgar_dades_taules.sql` | Neteja completa de taules |
| `afegir_logo_centres.sql` | Afegeix la columna `logo_url` a `centres` (logotips) |
| `immersions_backup.dump` | Backup PostgreSQL en format custom |
| `info-backup-bbdd.txt` | Instruccions detallades de backup/restore |

### Crear un usuari nou

Les contrasenyes es desen com a hash **bcrypt**, mai en text pla. El contenidor backend ja porta `bcryptjs`, així que pots generar el hash sense instal·lar res.

**1. Genera el hash de la contrasenya** (substitueix `LA_TEVA_CLAU`):

```bash
docker exec socbalena_backend node -e "console.log(require('bcryptjs').hashSync('LA_TEVA_CLAU', 10))"
```

Sortida d'exemple (això és el que copiaràs al pas 2):

```
$2b$10$U8e6q4ZRmGyxpDrcuJsI2uQC/Es449DknJbl/iGVGot287y/XskTO
```

**2. Edita `manteniment/crearUsuariApp.sql`** amb el nom, l'email i el hash:

```sql
INSERT INTO usuaris (nom, email, password_hash, rol)
VALUES ('Nou Nom', 'nou@exemple.cat', '$2b$10$...el-teu-hash...', 'bussejador');
```

- `id` i `creat_a` tenen valors per defecte (`uuid_generate_v4()` i `NOW()`), no cal indicar-los.
- `rol` només admet `admin` o `bussejador`.
- `avatar_url` pot quedar a `NULL` (es pot pujar després des del perfil).

**3. Executa l'script a la base de dades:**

```bash
docker cp ./manteniment/crearUsuariApp.sql socbalena_db:/tmp/crearUsuari.sql
docker exec socbalena_db psql -U socbalena -d socbalena -f /tmp/crearUsuari.sql
```

**4. Verifica i prova l'accés** a http://localhost:8085:

```bash
docker exec socbalena_db psql -U socbalena -d socbalena -c "SELECT nom,email,rol,creat_a FROM usuaris ORDER BY creat_a;"
```

> **Windows / PowerShell:** si prefereixes enganxar l'SQL directament, entra al psql interactiu
> (`docker compose exec db psql -U socbalena -d socbalena`) i enganxa-hi l'`INSERT`. Així evites
> que PowerShell interpreti els caràcters `$` del hash. Per sortir, `\q`.

**Canviar la contrasenya d'un usuari existent** (per exemple si l'has oblidada): genera el hash (pas 1) i, dins del psql interactiu:

```sql
UPDATE usuaris SET password_hash = '$2b$10$...hash-nou...' WHERE email = 'usuari@exemple.cat';
```

**Errors típics**

| Error | Causa |
|-------|-------|
| `duplicate key value violates unique constraint "usuaris_email_key"` | Ja existeix un usuari amb aquest email |
| `violates check constraint "usuaris_rol_check"` | El `rol` no és ni `admin` ni `bussejador` |

## Seguretat en producció

1. **Canvia tots els secrets** al fitxer `.env`
2. Usa un `JWT_SECRET` llarg i aleatori (mínim 32 caràcters)
3. Configura HTTPS (Let's Encrypt + Certbot)
4. Limita l'accés al port 5432 de PostgreSQL
5. Activa còpies de seguretat periòdiques
6. Assigna contrasenyes segures als usuaris que creïs
7. Revisa els permisos del volum `uploads`

## Rutes SPA (frontend)

| Hash | Vista | Descripció |
|------|-------|-----------|
| `#/` | Inici | Dashboard amb darreres immersions |
| `#/immersions` | Immersions | Llista paginada + formulari |
| `#/immersio/:id` | Detall | Fitxa completa + galeria |
| `#/centres` | Centres | Directori de centres |
| `#/centre/:id` | Detall del centre | Fitxa + zones associades |
| `#/zones` | Zones | Directori de zones |
| `#/zona/:id` | Detall de la zona | Fitxa + centres + immersions |
| `#/perfil` | Perfil | Perfil d'usuari |

## Llicència

Ús personal. Tots els drets reservats.
