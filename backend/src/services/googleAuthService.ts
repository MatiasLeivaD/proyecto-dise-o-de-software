import { createRemoteJWKSet, jwtVerify } from "jose"; // importamos las funciones createRemoteJWKSet y jwtVerify desde la biblioteca "jose" para manejar la verificación de tokens JWT (JSON Web Tokens) emitidos por Google. Estas funciones nos permiten validar la autenticidad y la integridad de los tokens recibidos durante el proceso de autenticación con Google, asegurando que los datos del usuario sean confiables y seguros.
import { env } from "../config/env.ts"; // importamos la variable env desde el archivo env.ts para poder acceder a las configuraciones de entorno de la aplicación, como la URL de redirección de Google y otros parámetros necesarios para la autenticación con Google. Esto nos permite manejar la autenticación de manera segura y consistente en toda la aplicación, adaptándonos a diferentes entornos de ejecución (desarrollo, producción, etc.).
import type { GoogleProfile } from "../models/user.ts"; // importamos el tipo GoogleProfile desde el archivo user.ts para poder usarlo en las funciones de este servicio y asegurarnos de que los objetos de perfil de Google tengan la estructura correcta. Esto nos permite trabajar con perfiles de Google de manera consistente y segura en toda la aplicación.

const googleKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
); // creamos un conjunto de claves JWK (JSON Web Key) remoto utilizando la función createRemoteJWKSet y la URL proporcionada por Google para obtener las claves públicas utilizadas para verificar los tokens JWT emitidos por Google. Esto nos permite validar la autenticidad y la integridad de los tokens recibidos durante el proceso de autenticación con Google, asegurando que los datos del usuario sean confiables y seguros.

export async function createGoogleLoginUrl(
  state: string,
  nonce: string,
  codeVerifier: string,
): Promise<string> { // definimos la función createGoogleLoginUrl como una función asíncrona que toma tres parámetros: state, nonce y codeVerifier. Esta función genera una URL de inicio de sesión de Google que incluye los parámetros necesarios para el flujo de autenticación OAuth 2.0 y PKCE (Proof Key for Code Exchange). La función devuelve una promesa que resuelve a una cadena de texto que representa la URL completa de inicio de sesión de Google.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier), // generamos un hash SHA-256 del codeVerifier utilizando la API de criptografía del navegador (crypto.subtle.digest) y un codificador de texto (TextEncoder). Esto nos permite crear un codeChallenge seguro que se utilizará en el proceso de autenticación con Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.
  );// generamos un hash SHA-256 del codeVerifier utilizando la API de criptografía del navegador (crypto.subtle.digest) y un codificador de texto (TextEncoder). Esto nos permite crear un codeChallenge seguro que se utilizará en el proceso de autenticación con Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest))) // convertimos el hash SHA-256 generado en una cadena de texto codificada en Base64 utilizando la función btoa y un arreglo de bytes (Uint8Array). Esto nos permite crear un codeChallenge seguro que se utilizará en el proceso de autenticación con Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.
    .replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", ""); // reemplazamos los caracteres especiales en la cadena codificada en Base64 para que sea compatible con la URL, utilizando el formato Base64URL. Esto nos permite crear un codeChallenge seguro que se utilizará en el proceso de autenticación con Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");// creamos un objeto URL utilizando la clase URL y la URL base de inicio de sesión de Google. Esto nos permite construir la URL completa de inicio de sesión de Google agregando los parámetros necesarios para el flujo de autenticación OAuth 2.0 y PKCE (Proof Key for Code Exchange).
  url.search = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  }).toString(); // agregamos los parámetros necesarios para el flujo de autenticación OAuth 2.0 y PKCE (Proof Key for Code Exchange) a la URL de inicio de sesión de Google utilizando la clase URLSearchParams. Esto nos permite construir la URL completa de inicio de sesión de Google que se utilizará para redirigir al usuario a la página de autenticación de Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.

  return url.toString();// devolvemos la URL completa de inicio de sesión de Google como una cadena de texto utilizando el método toString() del objeto URL. Esto nos permite redirigir al usuario a la página de autenticación de Google, donde podrá iniciar sesión y otorgar permisos a la aplicación, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.
}

export async function getGoogleProfile(
  code: string,
  nonce: string,
  codeVerifier: string,
): Promise<GoogleProfile> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(10000),
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code",
      code,
      code_verifier: codeVerifier,
    }),
  });// realizamos una solicitud HTTP POST a la URL de token de Google utilizando la función fetch, pasando los parámetros necesarios para intercambiar el código de autorización por un token de acceso y un ID token. Esto nos permite obtener la información del perfil del usuario autenticado en Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.

  if (!response.ok) throw new Error("Google authentication failed."); // si la respuesta de la solicitud HTTP no es exitosa (response.ok es falso), lanzamos un error indicando que la autenticación con Google ha fallado. Esto nos permite manejar los errores de autenticación de manera segura y consistente en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.

  const tokens = await response.json(); // parseamos la respuesta de la solicitud HTTP como un objeto JSON utilizando el método json() del objeto Response. Esto nos permite acceder a los tokens devueltos por Google, incluyendo el token de acceso y el ID token, que se utilizarán para obtener la información del perfil del usuario autenticado en Google, garantizando que la comunicación entre el cliente y el servidor sea segura y confiable.
  if (typeof tokens.id_token !== "string") {
    throw new Error("Google did not return an ID token.");
  } // si el objeto tokens no contiene un ID token válido (tokens.id_token no es una cadena de texto), lanzamos un error indicando que Google no devolvió un ID token. Esto nos permite manejar los errores de autenticación de manera segura y consistente en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.

  const { payload } = await jwtVerify(tokens.id_token, googleKeys, { 
    issuer: ["https://accounts.google.com", "accounts.google.com"], 
    audience: env.googleClientId,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "exp", "iat", "nonce"],
  }); // verificamos que el ID token devuelto por Google cumpla con los requisitos de autenticación, incluyendo el emisor (issuer), la audiencia (audience), los algoritmos de firma (algorithms) y los reclamos requeridos (requiredClaims). Esto nos permite validar la autenticidad y la integridad del ID token, asegurando que los datos del usuario sean confiables y seguros.

  if (
    payload.nonce !== nonce || typeof payload.sub !== "string" ||
    typeof payload.email !== "string" || payload.email_verified !== true ||
    (payload.azp !== undefined && payload.azp !== env.googleClientId)
  )//si el nonce del payload no coincide con el nonce proporcionado, o si el sub, email o email_verified del payload no son válidos, o si el azp del payload no coincide con el client_id de Google (si está presente), lanzamos un error indicando que la identidad de Google es inválida. Esto nos permite manejar los errores de autenticación de manera segura y consistente en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.
  {
    throw new Error("Invalid Google identity."); // esto nos permite manejar los errores de autenticación de manera segura y consistente en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: typeof payload.name === "string" ? payload.name : payload.email,
    picture: typeof payload.picture === "string" ? payload.picture : null,
  }; // retornamos un objeto GoogleProfile que contiene la información del perfil del usuario autenticado en Google, incluyendo el ID de Google (googleId), el correo electrónico (email), el nombre (name) y la URL de la imagen de perfil (picture). Esto nos permite trabajar con perfiles de Google de manera consistente y segura en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.
} // getGoogleProfile es una función que obtiene la información del perfil del usuario autenticado en Google a partir de un código de autorización, un nonce y un codeVerifier. La función realiza una solicitud HTTP POST a la URL de token de Google para intercambiar el código de autorización por un token de acceso y un ID token. Luego, verifica que el ID token cumpla con los requisitos de autenticación y devuelve un objeto GoogleProfile que contiene la información del perfil del usuario. Esto nos permite trabajar con perfiles de Google de manera consistente y segura en toda la aplicación, garantizando que la comunicación entre el cliente y el servidor sea confiable.
