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










<<<<<<< Updated upstream


## English version: 
=======
## English Version 
>>>>>>> Stashed changes

## Backend

The backend of the Personalized Restaurant Recommender manages user authentication, profile persistence, and sessions. It exposes HTTP endpoints for signing in with Google, retrieving the authenticated user's profile, and signing out.

### Technologies

| Technology | Purpose |
| --- | --- |
| Deno | Run the server and the project's validation tools. |
| TypeScript | Define data types and check the backend code. |
| SQLite | Persist users, sessions, and temporary authentication requests. |
| Google OpenID Connect | Authenticate users through their Google accounts and provide SSO. |
| jose | Verify the signature and claims of the ID token issued by Google. |

### Code Organization

The backend separates configuration, data access, authentication logic, and request handling.

| Directory | Responsibility |
| --- | --- |
| `src/config` | Read environment variables and initialize the database. |
| `src/models` | Define types for users and profiles received from Google. |
| `src/repositories` | Execute SQL queries to store, retrieve, and delete data. |
| `src/services` | Manage Google authentication, cookies, and sessions. |
| `src/controllers` | Coordinate operations and build HTTP responses. |
| `src/middleware` | Validate sessions before granting access to protected resources. |
| `src/routes` | Map HTTP methods and paths to their controllers. |
| `data` | Store the local SQLite database file. |
| `tests` | Contain automated authentication and session tests. |

`src/server.ts` starts the server. `src/app.ts` receives requests, handles the health endpoint, and delegates authentication operations to their corresponding routes.

### Google Authentication

The application uses Google as its identity provider to satisfy the SSO login requirement. Google authenticates the account, while the backend validates Google's response and manages the user's local account.

The authentication process works as follows:

1. The backend creates a temporary authentication request and redirects the browser to Google.
2. Google authenticates the user and returns an authorization code to the callback.
3. The backend verifies that the response matches the original request and exchanges the code for tokens.
4. It validates the ID token's signature, issuer, audience, and expiration, along with the `nonce` and verified email status.
5. It creates or updates the user's profile in SQLite and creates a local session.
6. The backend sends a session cookie and redirects the browser to the frontend's profile route.

Authentication requests use `state`, `nonce`, and PKCE. Each request expires after 10 minutes and can only be used once.

Google manages Google account credentials. The backend does not store user passwords or implement password-based registration.

### SQLite Persistence

SQLite stores data in a local file without requiring a separate database server. When the backend starts, it automatically creates `data/restaurant.db` and the required tables.

| Table | Purpose |
| --- | --- |
| `users` | Store the user's local identifier, Google identifier, email, name, profile picture, and creation date. |
| `sessions` | Store the hash of the session identifier, the associated user, and the expiration time. |
| `oauth_states` | Store the temporary data required to validate a Google authentication request. |

The Google identifier allows the backend to recognize the same user on subsequent sign-ins. The profile is updated while preserving the local identifier and creation date.

### Sessions and Protected Endpoints

Sessions use a random identifier generated by the backend. The browser receives this identifier in an `HttpOnly` cookie with `SameSite=Lax`; SQLite stores its hash and expiration time.

Sessions last 24 hours. Protected endpoints verify that the session exists and remains valid before returning information. Requests without a valid session receive an HTTP `401 Unauthorized` response.

During sign-out, the backend revokes the session identifier and removes the cookie. This operation also checks the request's origin. When the callback is configured with HTTPS, cookies include the `Secure` attribute.

Google's ID token is used during authentication. The application does not generate its own JWT to manage sessions.

### Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check that the server responds. |
| GET | `/api/auth/google` | Start Google sign-in. |
| GET | `/api/auth/google/callback` | Process and validate Google's response. |
| GET | `/api/auth/me` | Retrieve the user's profile through a valid session. |
| POST | `/api/auth/logout` | Revoke the user's session. |

### Configuration and Execution

The backend was developed with Deno 2.9.6. Backend configuration is defined in `deno.json`, and environment variables are configured using `.env.example` as a template.

Create `backend/.env` from that template and fill in the Google credentials:

```dotenv
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

The OAuth client must be configured as a web application, with an authorized redirect URI that matches `GOOGLE_REDIRECT_URI`. The Client Secret is used exclusively by the backend.

From the repository root, install the dependencies and start the server:

```bash
cd backend
deno install
deno task dev
```

The database is created automatically. `.gitignore` excludes the `.env` file, the local database, installed dependencies, and build output.

### Backend Validation

From the `backend` directory, run:

```bash
deno task check
deno task lint
deno task test
```

These tasks check types, lint the code, and run automated tests. The tests cover the rejection of requests without a session, OAuth state validation, user profile updates, and session validity, expiration, and revocation.

The automated tests do not perform an actual Google sign-in. Verifying the complete flow requires configuring OAuth credentials and integrating the frontend.

### Attribution and References

This backend was developed with assistance from ChatGPT/Codex in preparing and explaining the code.

- [Deno documentation](https://docs.deno.com/).
- [SQLite with Deno](https://docs.deno.com/examples/sqlite/).
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
<<<<<<< Updated upstream
- [jose library](https://github.com/panva/jose).
=======
- [jose library](https://github.com/panva/jose).
>>>>>>> Stashed changes
