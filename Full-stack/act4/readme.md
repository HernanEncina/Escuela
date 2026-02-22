
##API REST con autenticacion JWT, refresh tokens y CRUD de productos.

Tecnologias
- Node.js
- Express
- MongoDB Atlas
- JWT
- Jest

Instalacion y ejecucion local

1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd act4
```

2. Instalar dependencias
```bash
npm install
```

3. Crear archivo .env en la raiz
```env
PORT=3000
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/act4
ACCESS_TOKEN_SECRET=tu_secreto_access
REFRESH_TOKEN_SECRET=tu_secreto_refresh
```

4. Ejecutar en desarrollo
```bash
npm run dev
```

La API estara disponible en http://localhost:3000

## Endpoints

### Autenticacion (/api/auth)
- POST /register - Registrar usuario
- POST /login - Iniciar sesion
- POST /token - Refrescar token
- POST /logout - Cerrar sesion

### Productos (/api/products)
- GET / - Obtener productos del usuario
- POST / - Crear producto
- PUT /:id - Actualizar producto
- DELETE /:id - Eliminar producto

## Frontend
Los archivos estan en la carpeta public:
- http://localhost:3000/login.html
- http://localhost:3000/register.html
- http://localhost:3000/dashboard.html

## Tests
```bash
npm test
```

## Despliegue en Vercel

1. Instalar Vercel CLI
```bash
npm i -g vercel
```

2. Configurar variables en Vercel (MONGO_URI, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET)

3. Desplegar
```bash
vercel --prod
```

La API quedara disponible en https://act4-six.vercel.app


`