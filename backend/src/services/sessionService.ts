import { env } from "../config/env.ts"; // importamos la variable env desde el archivo env.ts para poder acceder a las configuraciones de entorno de la aplicación, como la duración de la sesión y otros parámetros necesarios para la creación y gestión de sesiones. Esto nos permite manejar las sesiones de manera segura y consistente en toda la aplicación, adaptándonos a diferentes entornos de ejecución (desarrollo, producción, etc.).
import {
  deleteSession,
  findSessionUserId,
  saveSession,
} from "../repositories/sessionRepository.ts"; // importamos las funciones deleteSession, findSessionUserId y saveSession desde el archivo sessionRepository.ts para poder interactuar con la base de datos y realizar operaciones relacionadas con el almacenamiento, búsqueda y eliminación de sesiones. Esto nos permite gestionar las sesiones de manera segura y consistente en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
import { findUserById } from "../repositories/userRepository.ts";// importamos la función findUserById desde el archivo userRepository.ts para poder buscar usuarios en la base de datos por su id. Esto nos permite obtener información de un usuario específico de manera segura y consistente en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
import { readCookie } from "./cookieService.ts";// importamos la función readCookie desde el archivo cookieService.ts para poder leer cookies de la solicitud HTTP entrante. Esto nos permite manejar las cookies de manera segura y consistente en toda la aplicación, asegurándonos de que podamos leer las cookies proporcionadas por el cliente y utilizarlas para gestionar las sesiones de usuario.

export function createRandomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32)); // generamos un arreglo de 32 bytes aleatorios utilizando la API de criptografía del navegador (crypto.getRandomValues). Esto nos permite crear tokens únicos y seguros que se pueden utilizar para identificar sesiones de usuario de manera confiable en toda la aplicación.
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  ); // convertimos cada byte del arreglo en una representación hexadecimal de dos dígitos utilizando el método toString(16) y padStart(2, "0"). Luego, unimos todos los valores hexadecimales en una sola cadena de texto utilizando el método join(""). Esto nos permite crear tokens únicos y seguros que se pueden utilizar para identificar sesiones de usuario de manera confiable en toda la aplicación.
}// createRandomToken es una función que genera un token aleatorio de 32 bytes utilizando la API de criptografía del navegador (crypto.getRandomValues). Luego, convierte cada byte en una representación hexadecimal de dos dígitos y los une en una cadena de texto. Esto nos permite crear tokens únicos y seguros que se pueden utilizar para identificar sesiones de usuario de manera confiable en toda la aplicación.

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  ); // utilizamos la API de criptografía del navegador (crypto.subtle.digest) para calcular el hash SHA-256 del token proporcionado. Primero, codificamos el token en un arreglo de bytes utilizando TextEncoder().encode(token). Luego, pasamos el arreglo de bytes a la función digest() para obtener el hash. Esto nos permite crear un hash seguro y confiable del token que se puede utilizar para identificar sesiones de usuario de manera segura en toda la aplicación.
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join(""); 
}// hashToken es una función asíncrona que calcula el hash SHA-256 de un token proporcionado utilizando la API de criptografía del navegador (crypto.subtle.digest). Primero, codifica el token en un arreglo de bytes utilizando TextEncoder().encode(token). Luego, pasa el arreglo de bytes a la función digest() para obtener el hash. Finalmente, convierte cada byte del hash en una representación hexadecimal de dos dígitos y los une en una cadena de texto. Esto nos permite crear un hash seguro y confiable del token que se puede utilizar para identificar sesiones de usuario de manera segura en toda la aplicación.

export async function createSession(userId: string): Promise<string> {
  const token = createRandomToken(); // generamos un token aleatorio utilizando la función createRandomToken(). Esto nos permite crear un token único y seguro que se puede utilizar para identificar la sesión de usuario de manera confiable en toda la aplicación.
  saveSession(
    await hashToken(token),
    userId,
    Date.now() + env.sessionDuration * 1000,
  ); // guardamos la sesión en la base de datos utilizando la función saveSession(), pasando el hash del token, el userId y la fecha de expiración de la sesión (calculada sumando la duración de la sesión en segundos al tiempo actual). Esto nos permite crear sesiones de usuario seguras y confiables en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
  return token; // devolvemos el token generado para que pueda ser utilizado por el cliente para autenticar futuras solicitudes. Esto nos permite crear sesiones de usuario seguras y confiables en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
} // createSession es una función asíncrona que crea una nueva sesión para un usuario específico. Primero, genera un token aleatorio utilizando la función createRandomToken(). Luego, calcula el hash del token utilizando la función hashToken() y guarda la sesión en la base de datos utilizando la función saveSession(), pasando el hash del token, el userId y la fecha de expiración de la sesión (calculada sumando la duración de la sesión en segundos al tiempo actual). Finalmente, devuelve el token generado. Esto nos permite crear sesiones de usuario seguras y confiables en toda la aplicación.

export async function getSessionUser(request: Request) {
  const token = readCookie(request, "session"); // leemos la cookie "session" de la solicitud HTTP entrante utilizando la función readCookie(). Esto nos permite obtener el token de sesión proporcionado por el cliente para autenticar futuras solicitudes y gestionar las sesiones de usuario de manera segura y confiable en toda la aplicación.
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null; // verificamos si el token existe y si tiene un formato válido (una cadena hexadecimal de 64 caracteres). Si el token no es válido, devolvemos null. Esto nos permite manejar las sesiones de usuario de manera segura y confiable en toda la aplicación, asegurándonos de que las solicitudes de autenticación sean válidas y confiables.  

  const userId = findSessionUserId(await hashToken(token));// buscamos el userId asociado a la sesión en la base de datos utilizando la función findSessionUserId(), pasando el hash del token obtenido de la cookie "session". Esto nos permite obtener el identificador del usuario autenticado de manera segura y confiable en toda la aplicación.
  return userId ? findUserById(userId) : null; // si se encuentra un userId asociado a la sesión, buscamos y devolvemos el usuario correspondiente utilizando la función findUserById(); de lo contrario, devolvemos null. Esto nos permite obtener información del usuario autenticado de manera segura y confiable en toda la aplicación.
} // getSessionUser es una función asíncrona que obtiene el usuario asociado a la sesión de la solicitud HTTP entrante. Primero, lee la cookie "session" utilizando la función readCookie(). Luego, verifica si el token existe y si tiene un formato válido (una cadena hexadecimal de 64 caracteres). Si el token es válido, calcula su hash utilizando la función hashToken() y busca el userId asociado a la sesión en la base de datos utilizando la función findSessionUserId(). Finalmente, si se encuentra un userId, busca y devuelve el usuario correspondiente utilizando la función findUserById(); de lo contrario, devuelve null. Esto nos permite obtener información del usuario autenticado de manera segura y confiable en toda la aplicación.

export async function destroySession(request: Request): Promise<void> {
  const token = readCookie(request, "session"); // leemos la cookie "session" de la solicitud HTTP entrante utilizando la función readCookie(). Esto nos permite obtener el token de sesión proporcionado por el cliente para autenticar futuras solicitudes y gestionar las sesiones de usuario de manera segura y confiable en toda la aplicación.
  if (token) deleteSession(await hashToken(token)); // eliminamos la sesión correspondiente en la base de datos utilizando la función deleteSession(), pasando el hash del token obtenido de la cookie "session". Esto nos permite gestionar las sesiones de usuario de manera segura y confiable en toda la aplicación, asegurándonos de que las solicitudes de autenticación sean válidas y confiables.
}// destroySession es una función asíncrona que elimina la sesión asociada a la solicitud HTTP entrante. Primero, lee la cookie "session" utilizando la función readCookie(). Luego, si el token existe, calcula su hash utilizando la función hashToken() y elimina la sesión correspondiente en la base de datos utilizando la función deleteSession(). Esto nos permite gestionar las sesiones de usuario de manera segura y confiable en toda la aplicación, asegurándonos de que las solicitudes de autenticación sean válidas y confiables.
