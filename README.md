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
│           ├── immersions.js   ← Llista paginada + formulari creació/edició
│           ├── immersio-detall.js ← Fitxa detallada + galeria media
│           ├── centres.js      ← Llista i gestió de centres
│           ├── zones.js        ← Llista i gestió de zones
│           └── perfil.js       ← Perfil d'usuari
├── nginx/
│   ├── Dockerfile              ← Nginx Alpine
│   └── nginx.conf              ← SPA routing + proxy API + cache uploads
└── manteniment/
    ├── crearUsuariApp.sql      ← Script creació nous usuaris
    ├── inserts_immersions.sql  ← Inserció massiva d'immersions
    ├── purgar_dades_taules.sql ← Neteja de taules
    ├── immersions_backup.dump  ← Backup PostgreSQL (format custom)
    └── info-backup-bbdd.txt    ← Instruccions backup/restore
```

## Esquema de base de dades

```
usuaris (UUID PK) ──────┬──< immersions (UUID PK)
  · nom                  │     · data, numero_immersio
  · email (unique)       │     · profunditat_max/mitja, temps_fons
  · password_hash        │     · pressio_entrada/sortida
  · rol (admin/bussejador)│    · visibilitat, corrent, onatge
  · avatar_url           │     · temp_aigua/aire, tipus_vestit
                         │     · company, instructor, valoracio
                         │     · tipus_immersio, notes
                         │           │
centres (UUID PK) ────< zones        ├──< media (UUID PK)
  · nom, pais, regio       │          │     · tipus (foto/video)
  · telefon, email, web    │          │     · nom_fitxer, descripcio
                           │          │     · es_portada, mida_bytes
                           └──────────┘     · amplada, alcada
                         FK               · durada_seg (vídeos)
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

### Credencials de demo

| Camp | Valor |
|------|-------|
| Email | `admin@socbalena.cat` |
| Contrasenya | `Demo1234!` |

> Canvia la contrasenya de demo en producció!

## API Reference

Totes les rutes (excepte login) requereixen header `Authorization: Bearer <token>`.

### Autenticació

```
POST /api/auth/login
  Body: { email, password }
  Resposta: { token, usuari: { id, nom, email, rol, avatar_url } }

GET  /api/auth/perfil
  Resposta: { id, nom, email, rol, avatar_url, creat_a }
```

### Immersions

```
GET    /api/immersions
  Query: ?page=1&limit=20&zona_id=<uuid>&any=2024
  Resposta: { total, pagina, immersions: [...] }

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
  Resposta: llista amb centre_nom + num_immersions (comptador)

GET    /api/zones/:id
  Resposta: zona completa

POST   /api/zones
  Body: { nom, centre_id?, pais?, regio?, latitud?, longitud?,
          tipus?, nivell_dificultat?, profunditat_max?, descripcio?, notes? }

PUT    /api/zones/:id
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
| `immersions_backup.dump` | Backup PostgreSQL en format custom |
| `info-backup-bbdd.txt` | Instruccions detallades de backup/restore |

## Seguretat en producció

1. **Canvia tots els secrets** al fitxer `.env`
2. Usa un `JWT_SECRET` llarg i aleatori (mínim 32 caràcters)
3. Configura HTTPS (Let's Encrypt + Certbot)
4. Limita l'accés al port 5432 de PostgreSQL
5. Activa còpies de seguretat periòdiques
6. Canvia les credencials de demo (`Demo1234!`)
7. Revisa els permisos del volum `uploads`

## Rutes SPA (frontend)

| Hash | Vista | Descripció |
|------|-------|-----------|
| `#/` | Inici | Dashboard amb darreres immersions |
| `#/immersions` | Immersions | Llista paginada + formulari |
| `#/immersio/:id` | Detall | Fitxa completa + galeria |
| `#/centres` | Centres | Directori de centres |
| `#/zones` | Zones | Directori de zones |
| `#/perfil` | Perfil | Perfil d'usuari |

## Llicència

Ús personal. Tots els drets reservats.
