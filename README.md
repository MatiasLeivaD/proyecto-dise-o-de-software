## Recomendador Personalizado de restaurantes

## Backend

El backend del Recomendador Personalizado de Restaurantes gestiona la autenticación de usuarios, la persistencia de sus perfiles y el control de sesiones. Expone endpoints HTTP que permiten iniciar sesión con Google, consultar el usuario autenticado y cerrar la sesión.

### Tecnologías utilizadas

| Tecnología | Función |
| --- | --- |
| Deno | Ejecutar el servidor y las herramientas de comprobación del proyecto. |
| TypeScript | Definir los tipos de datos y comprobar el código del backend. |
| SQLite | Conservar usuarios, sesiones y solicitudes temporales de autenticación. |
| Google OpenID Connect | Autenticar al usuario mediante su cuenta de Google y proporcionar acceso con SSO. |
| jose | Verificar la firma y los datos del ID token emitido por Google. |

### Organización del código

El backend separa la configuración, el acceso a datos, la lógica de autenticación y la atención de solicitudes.

| Carpeta | Responsabilidad |
| --- | --- |
| `src/config` | Leer variables de entorno y preparar la base de datos. |
| `src/models` | Definir los tipos del usuario y del perfil recibido de Google. |
| `src/repositories` | Ejecutar consultas SQL para guardar, consultar y eliminar datos. |
| `src/services` | Gestionar el acceso con Google, las cookies y las sesiones. |
| `src/controllers` | Coordinar las operaciones y construir las respuestas HTTP. |
| `src/middleware` | Comprobar la sesión antes de permitir el acceso a recursos protegidos. |
| `src/routes` | Asociar los métodos y rutas HTTP con sus controladores. |
| `data` | Almacenar el archivo local de SQLite. |
| `tests` | Contener las pruebas automatizadas de autenticación y sesiones. |

`src/server.ts` inicia el servidor. `src/app.ts` recibe las solicitudes, atiende el endpoint de salud y delega las operaciones de autenticación a sus rutas correspondientes.

### Autenticación con Google

La aplicación utiliza Google como proveedor de identidad para cumplir el requisito de inicio de sesión con SSO. Google comprueba el acceso a la cuenta, mientras que nuestro backend valida su respuesta y administra la cuenta local del usuario.

El proceso de autenticación es el siguiente:

1. El backend genera una solicitud temporal de acceso y redirige el navegador a Google.
2. Google autentica al usuario y devuelve un código de autorización al callback.
3. El backend verifica que la respuesta corresponda a la solicitud iniciada e intercambia el código por tokens.
4. Se valida la firma, el emisor, la audiencia y el vencimiento del ID token, además del `nonce` y del correo verificado.
5. Se registra o actualiza el perfil del usuario en SQLite y se crea una sesión local.
6. El backend envía una cookie de sesión y redirige al navegador a la ruta de perfil de la interfaz.

Las solicitudes de acceso utilizan `state`, `nonce` y PKCE. Cada solicitud vence después de 10 minutos y se consume una sola vez.

Las credenciales de la cuenta de Google se administran en Google. El backend no almacena contraseñas de usuarios ni implementa un registro con contraseña propia.

### Persistencia con SQLite

SQLite permite conservar los datos en un archivo local sin administrar un servidor de base de datos adicional. Al iniciar el backend se crea automáticamente el archivo `data/restaurant.db` y las tablas necesarias.

| Tabla | Propósito |
| --- | --- |
| `users` | Guardar el identificador local, el identificador de Google, el correo, el nombre, la imagen y la fecha de creación del usuario. |
| `sessions` | Guardar el hash del identificador de sesión, el usuario asociado y el vencimiento. |
| `oauth_states` | Guardar los datos temporales necesarios para validar una solicitud de acceso con Google. |

El identificador de Google permite reconocer al mismo usuario en accesos posteriores. Su perfil se actualiza conservando el identificador local y la fecha de creación.

### Sesiones y protección de endpoints

La sesión se administra mediante un identificador aleatorio generado por el backend. El navegador recibe ese identificador en una cookie `HttpOnly` con `SameSite=Lax`; SQLite conserva su hash y vencimiento.

Las sesiones duran 24 horas. Los endpoints protegidos comprueban que la sesión exista y siga vigente antes de devolver información. Una solicitud sin una sesión válida recibe una respuesta HTTP `401 Unauthorized`.

Al cerrar sesión, el backend revoca el identificador y elimina la cookie. Esta operación también comprueba el origen de la solicitud. Cuando el callback se configura con HTTPS, las cookies incorporan el atributo `Secure`.

El ID token de Google se utiliza durante la autenticación. La aplicación no genera un JWT propio para administrar sus sesiones.

### Endpoints

| Método | Ruta | Función |
| --- | --- | --- |
| GET | `/api/health` | Comprobar que el servidor responde. |
| GET | `/api/auth/google` | Iniciar el acceso con Google. |
| GET | `/api/auth/google/callback` | Procesar y validar la respuesta de Google. |
| GET | `/api/auth/me` | Consultar el perfil del usuario con una sesión válida. |
| POST | `/api/auth/logout` | Revocar la sesión del usuario. |

### Configuración y ejecución

Se utilizó Deno 2.9.6 para el desarrollo. La configuración del backend se declara en `deno.json` y las variables de entorno se preparan a partir de `.env.example`.

Crea `backend/.env` a partir de esa plantilla y completa los valores de Google:

```dotenv
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

El cliente OAuth debe ser de tipo aplicación web y tener autorizada la misma URI de redirección configurada en `GOOGLE_REDIRECT_URI`. El Client Secret se utiliza únicamente en el backend.

Desde la raíz del repositorio, instala las dependencias e inicia el servidor:

```bash
cd backend
deno install
deno task dev
```

La base de datos se crea automáticamente. `.gitignore` excluye el archivo `.env`, la base local, las dependencias instaladas y los archivos de compilación.

### Comprobación del backend

Dentro de `backend`, ejecuta:

```bash
deno task check
deno task lint
deno task test
```

Estas tareas comprueban los tipos, revisan el código y ejecutan las pruebas automatizadas. Las pruebas cubren el rechazo de accesos sin sesión, la validación del estado OAuth, la actualización del usuario y la validez, vencimiento y revocación de sesiones.

Las pruebas automatizadas no realizan un acceso real a Google. La comprobación del flujo completo requiere configurar las credenciales OAuth e integrar la interfaz.

### Autoría y referencias

Este backend se elaboró con asistencia de ChatGPT/Codex para la preparación y explicación del código.

- [Documentación de Deno](https://docs.deno.com/).
- [SQLite con Deno](https://docs.deno.com/examples/sqlite/).
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
- [Biblioteca jose](https://github.com/panva/jose).