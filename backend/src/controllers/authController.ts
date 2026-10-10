import { env } from "../config/env.ts"; // importamos el objeto env desde el archivo de configuración env.ts, que contiene varias configuraciones de entorno, como el puerto del servidor, la URL de origen del frontend, las credenciales de Google OAuth y la duración de la sesión en segundos.
import type { User } from "../models/user.ts"; // importamos la interfaz User desde el archivo de modelos user.ts, que define la estructura de un objeto de usuario, incluyendo propiedades como id, googleId, email, name, picture y createdAt.
  consumeOAuthState,
  saveOAuthState,
} from "../repositories/oauthRepository.ts"; // importamos las funciones consumeOAuthState y saveOAuthState desde el archivo de repositorios oauthRepository.ts, que se encargan de guardar y consumir el estado de OAuth en la base de datos.
import { saveGoogleUser } from "../repositories/userRepository.ts";
import { createCookie, readCookie } from "../services/cookieService.ts"; // importamos las funciones createCookie y readCookie desde el archivo de servicios cookieService.ts, que se encargan de crear y leer cookies en las respuestas y solicitudes HTTP.
import {
  createGoogleLoginUrl, // createGoogleLoginUrl es una función que genera la URL de inicio de sesión de Google, incluyendo los parámetros necesarios para el flujo de autenticación OAuth.
  getGoogleProfile, // getGoogleProfile es una función que obtiene el perfil del usuario de Google utilizando el código de autorización, el nonce y el codeVerifier proporcionados durante el flujo de autenticación OAuth.
} from "../services/googleAuthService.ts"; // importamos las funciones createGoogleLoginUrl y getGoogleProfile desde el archivo de servicios googleAuthService.ts, que se encargan de crear la URL de inicio de sesión de Google y obtener el perfil del usuario de Google, respectivamente.
import {
  createRandomToken, // createRamdomToken es una función que genera un token aleatorio, que se utiliza para crear estados y verificadores de código en el flujo de autenticación OAuth.
  createSession, // createSession es una función que crea una nueva sesión para un usuario, generando un token de sesión y almacenándolo en la base de datos.
  destroySession, // destroySession es una función que destruye una sesión existente, eliminando el token de sesión de la base de datos y revocando el acceso del usuario.
} from "../services/sessionService.ts";

function redirectToLogin(error: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      location: `${env.frontendOrigin}/?authError=${error}`,
      "set-cookie": createCookie("oauth_state", "", 0),
    },
  });
} // redirectToLogin es una función que redirige al usuario a la página de inicio de sesión del frontend, incluyendo un parámetro de error en la URL y eliminando la cookie de estado de OAuth. Se utiliza para manejar errores durante el flujo de autenticación OAuth.

export async function startGoogleLogin(): Promise<Response> {
  if (!env.googleClientId || !env.googleClientSecret) {
    return redirectToLogin("not_configured");
  }

  const state = createRandomToken();
  const nonce = createRandomToken();
  const codeVerifier = createRandomToken();
  saveOAuthState(state, nonce, codeVerifier); // guardamos el estado, nonce y codeVerifier generados en la base de datos utilizando la función saveOAuthState. Esto permite que el flujo de autenticación OAuth sea seguro y que podamos verificar la validez del estado cuando el usuario regrese desde Google.

  return new Response(null, {
    status: 302,
    headers: {
      location: await createGoogleLoginUrl(state, nonce, codeVerifier),
      "set-cookie": createCookie("oauth_state", state, 600),
    }, // retornamos una respuesta HTTP con un estado 302 (redirección) y establecemos la cabecera "location" con la URL de inicio de sesión de Google generada por createGoogleLoginUrl, incluyendo el estado, nonce y codeVerifier. También establecemos una cookie "oauth_state" con el valor del estado generado, que expira en 600 segundos (10 minutos).
  });
} // startGoogleLogin es una función que inicia el flujo de autenticación OAuth con Google. Genera un estado, un nonce y un codeVerifier aleatorios, los guarda en la base de datos y redirige al usuario a la URL de inicio de sesión de Google, incluyendo el estado en la cookie de OAuth. Si las credenciales de Google no están configuradas, redirige al usuario a la página de inicio de sesión con un error.

export async function finishGoogleLogin(request: Request): Promise<Response> {
  const parameters = new URL(request.url).searchParams;
  const state = parameters.get("state"); // finalizamos el flujo de autenticación OAuth con Google. Obtenemos los parámetros de la URL de la solicitud, incluyendo el estado y el código de autorización devueltos por Google después de que el usuario haya iniciado sesión y autorizado la aplicación.

  if (!state || state !== readCookie(request, "oauth_state")) {
    return redirectToLogin("invalid_state");
  } // verificamos que el estado recibido en los parámetros de la URL coincida con el estado almacenado en la cookie "oauth_state". Si no coincide o no está presente, redirigimos al usuario a la página de inicio de sesión con un error de estado inválido.

  const savedState = consumeOAuthState(state); // consumimos el estado almacenado en la base de datos utilizando la función consumeOAuthState. Esto asegura que el estado solo se pueda usar una vez y que no pueda ser reutilizado por un atacante. Si el estado no existe o ha expirado, redirigimos al usuario a la página de inicio de sesión con un error de estado inválido.
  if (!savedState) return redirectToLogin("invalid_state"); // condisinamos que si el estado consumido no existe, redirigimos al usuario a la página de inicio de sesión con un error de estado inválido.
  if (parameters.has("error")) return redirectToLogin("cancelled"); // tambien verificamos si los parámetros de la URL contienen un error, lo que indica que el usuario canceló el inicio de sesión o que hubo un problema durante el flujo de autenticación. En ese caso, redirigimos al usuario a la página de inicio de sesión con un error de cancelación.

  const code = parameters.get("code");
  if (!code) return redirectToLogin("failed");

  try {
    const profile = await getGoogleProfile(
      code,
      savedState.nonce,
      savedState.codeVerifier,
    );// obtenemos el perfil del usuario de Google utilizando la función getGoogleProfile, pasando el código de autorización, el nonce y el codeVerifier almacenados en el estado consumido. Esto nos permite obtener información del usuario autenticado, como su ID de Google, correo electrónico, nombre y foto de perfil.
    const user = saveGoogleUser(profile);
    await destroySession(request);
    const sessionToken = await createSession(user.id);
    const headers = new Headers({
      location: `${env.frontendOrigin}/dashboard`,
    });
    headers.append(
      "set-cookie",
      createCookie("session", sessionToken, env.sessionDuration),
    );
    headers.append("set-cookie", createCookie("oauth_state", "", 0));

    return new Response(null, { status: 302, headers });
  } // guardamos o actualizamos el usuario en la base de datos utilizando la función saveGoogleUser, que devuelve el objeto de usuario correspondiente. Luego, destruimos cualquier sesión existente asociada con la solicitud actual y creamos una nueva sesión para el usuario autenticado utilizando la función createSession. Finalmente, preparamos las cabeceras de la respuesta HTTP, incluyendo la redirección al dashboard del frontend y las cookies de sesión y estado de OAuth, y devolvemos una respuesta con un estado 302 (redirección) y las cabeceras correspondientes.
  catch {
    console.error("Google authentication failed.");
    return redirectToLogin("failed");
  } // si ocurre algún error durante el proceso de obtención del perfil de Google, guardado del usuario o creación de la sesión, capturamos la excepción, registramos un mensaje de error en la consola y redirigimos al usuario a la página de inicio de sesión con un error de fallo. Esto asegura que cualquier problema durante el flujo de autenticación sea manejado adecuadamente y que el usuario reciba retroalimentación sobre el error ocurrido.
} // finishGoogleLogin es una función que finaliza el flujo de autenticación OAuth con Google. Verifica el estado recibido, obtiene el código de autorización, obtiene el perfil del usuario de Google, guarda o actualiza el usuario en la base de datos, crea una nueva sesión y redirige al usuario al dashboard del frontend. Si ocurre algún error durante este proceso, redirige al usuario a la página de inicio de sesión con un error de fallo.

export function getCurrentUser(user: User): Response {
  return Response.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      createdAt: user.createdAt,
    }, // retornamos una respuesta HTTP con un estado 200 (OK) y un cuerpo JSON que contiene la información del usuario actual, incluyendo su ID, correo electrónico, nombre, foto de perfil y fecha de creación. Esto permite al frontend obtener los detalles del usuario autenticado y mostrarlos en la interfaz de usuario.
  });
} // getCurrentUser es una función que devuelve la información del usuario actual en formato JSON. Toma un objeto de usuario como parámetro y construye una respuesta HTTP con el estado 200 (OK) y el cuerpo de la respuesta que contiene los detalles del usuario, incluyendo su ID, correo electrónico, nombre, foto de perfil y fecha de creación. Esta función se utiliza para proporcionar información del usuario autenticado al frontend.

export async function logout(request: Request): Promise<Response> {
  if (request.headers.get("origin") !== env.frontendOrigin) {
    return Response.json({ error: "invalid_origin" }, { status: 403 });
  } // verificamos que el origen de la solicitud coincida con el origen del frontend configurado en las variables de entorno. Si no coincide, devolvemos una respuesta HTTP con un estado 403 (Prohibido) y un cuerpo JSON que indica un error de origen inválido. Esto ayuda a prevenir ataques de falsificación de solicitudes entre sitios (CSRF) al asegurarnos de que solo las solicitudes provenientes del frontend autorizado puedan realizar la acción de cierre de sesión.

  await destroySession(request);
  return Response.json({ success: true }, {
    headers: { "set-cookie": createCookie("session", "", 0) },
  }); // destruimos la sesión actual del usuario utilizando la función destroySession, que elimina el token de sesión de la base de datos y revoca el acceso del usuario. Luego, devolvemos una respuesta HTTP con un estado 200 (OK) y un cuerpo JSON que indica que la operación fue exitosa. Además, establecemos una cookie "session" vacía con un tiempo de expiración de 0 segundos, lo que efectivamente elimina la cookie de sesión en el navegador del usuario, asegurando que la sesión se cierre correctamente.
} 
// logout es una función que cierra la sesión del usuario actual. Verifica el origen de la solicitud, destruye la sesión y devuelve una respuesta HTTP con un estado 200 (OK) y un cuerpo JSON que indica éxito, además de eliminar la cookie de sesión en el navegador del usuario.
