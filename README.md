# 🐋 SócBalena — Diari de busseig personal

Aplicació web fullstack per gestionar el teu historial d'immersions de busseig recreatiu. Amb fitxes imprimibles, galeria de fotos i vídeos, estadístiques i molt més.

## Característiques

- **Immersions**: Registra tots els paràmetres de cada immersió (profunditat, temps, pressió, condicions, equipament...)
- **Fitxa imprimible**: Cada immersió té una fitxa que pots imprimir o exportar a PDF
- **Galeria multimèdia**: Puja fotos i mini-vídeos per cada immersió, descarrega'ls, estableix portada
- **Centres de busseig**: Directori de centres amb les seves zones associades
- **Zones de busseig**: Mapa de spots amb tipus, dificultat, coordenades i descripció
- **Estadístiques**: Gràfiques de profunditat, immersions per any/mes, zones més visitades
- **Autenticació JWT**: Sistema multi-usuari amb sessions segures
- **Disseny submarí**: Interfície en blau abissal amb accents cian fosforescent

## Stack tecnològic

| Capa | Tecnologia |
|------|-----------|
| Backend | Node.js + Express |
| Base de dades | PostgreSQL 16 |
| Frontend | Vanilla JS (ES Modules, SPA hash routing) |
| Servidor web | Nginx |
| Contenidors | Docker + Docker Compose |
| Autenticació | JWT (jsonwebtoken) |
| Uploads | Multer + Sharp |
| PDF | html2pdf.js (CDN) |

## Estructura del projecte

```
socbalena/
├── docker-compose.yml
├── .env.example
├── db/
│   └── init.sql              ← Esquema PostgreSQL + dades demo
├── backend/
│   ├── Dockerfile
│   ├── server.js             ← Express app
│   ├── db/pool.js            ← Connexió PostgreSQL
│   ├── middleware/auth.js    ← JWT middleware
│   └── routes/
│       ├── auth.js           ← Login, registre, perfil
│       ├── immersions.js     ← CRUD immersions + estadístiques
│       ├── centres.js        ← CRUD centres
│       ├── zones.js          ← CRUD zones
│       └── media.js          ← Pujada/baixada fotos i vídeos
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── main.css          ← Sistema de disseny complet
│   │   └── print.css         ← Estils d'impressió
│   └── js/
│       ├── app.js            ← Router SPA + estat global
│       ├── api.js            ← Client HTTP
│       └── views/
│           ├── login.js
│           ├── inici.js      ← Dashboard
│           ├── immersions.js ← Llista + formulari
│           ├── immersio-detall.js ← Fitxa + galeria
│           ├── centres.js
│           ├── zones.js
│           ├── estadistiques.js
│           └── perfil.js
└── nginx/
    ├── Dockerfile
    └── nginx.conf
```

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
nano .env   # ← Canvia els passwords!
```

### 2. Arrancar

```bash
docker compose up -d --build
```

Espera uns 30 segons perquè PostgreSQL inicialitzi l'esquema.

### 3. Accedir

- **Aplicació**: http://localhost
- **API**: http://localhost/api/health

### Credencials de demo

| Camp | Valor |
|------|-------|
| Email | `admin@socbalena.cat` |
| Contrasenya | `Demo1234!` |

> ⚠️ Canvia la contrasenya de demo en producció!

## API Reference

### Autenticació

```
POST /api/auth/login        → { token, usuari }
POST /api/auth/registre     → { token, usuari }
GET  /api/auth/perfil       → usuari (requereix Bearer token)
```

### Immersions

```
GET    /api/immersions           → llista paginada
GET    /api/immersions/:id       → detall + media
POST   /api/immersions           → crear
PUT    /api/immersions/:id       → editar
DELETE /api/immersions/:id       → eliminar
GET    /api/immersions/estadistiques → resum numèric
```

### Centres i zones

```
GET/POST         /api/centres
GET/PUT/DELETE   /api/centres/:id

GET/POST         /api/zones
GET/PUT/DELETE   /api/zones/:id
```

### Media (fotos i vídeos)

```
POST   /api/media/:immersio_id        → pujar fitxer (multipart)
PATCH  /api/media/:id/portada         → marcar com a portada
PATCH  /api/media/:id                 → actualitzar descripció
DELETE /api/media/:id                 → eliminar
```

Els fitxers pujats es serveixen a `/uploads/<usuari_id>/<fitxer>`.

## Comandes útils

```bash
# Aturar
docker compose down

# Aturar i esborrar dades (⚠️ irreversible)
docker compose down -v

# Veure logs backend
docker compose logs -f backend

# Accedir a PostgreSQL
docker compose exec db psql -U socbalena -d socbalena

# Backup de la base de dades
docker compose exec db pg_dump -U socbalena socbalena > backup.sql

# Restaurar backup
cat backup.sql | docker compose exec -T db psql -U socbalena -d socbalena
```

## Seguretat en producció

1. **Canvia tots els secrets** al fitxer `.env`
2. Usa un `JWT_SECRET` llarg i aleatori (mínim 32 caràcters)
3. Configura HTTPS (Let's Encrypt + Certbot)
4. Limita l'accés al port 5432 de PostgreSQL
5. Activa còpies de seguretat periòdiques

## Llicència

Ús personal. Tots els drets reservats.
