import {
  finishGoogleLogin,
  getCurrentUser,
  logout,
  startGoogleLogin,
} from "../controllers/authController.ts"; // importamos las funciones finishGoogleLogin, getCurrentUser, logout y startGoogleLogin desde el archivo authController.ts para poder manejarlas en las rutas de autenticación. Estas funciones se encargan de iniciar y finalizar el proceso de inicio de sesión con Google, obtener la información del usuario actual y cerrar la sesión del usuario, respectivamente. Esto nos permite manejar la autenticación de manera centralizada y consistente en toda la aplicación.
import { requireAuth } from "../middleware/requireAuth.ts"; // importamos la función requireAuth desde el archivo requireAuth.ts para poder usarla como middleware en las rutas de autenticación. Esta función se encarga de verificar si el usuario está autenticado antes de permitir el acceso a ciertas rutas protegidas. Esto nos permite asegurar que solo los usuarios autenticados puedan acceder a recursos sensibles y mantener la seguridad de la aplicación.

export async function authRoutes(request: Request): Promise<Response | null> {
  const path = new URL(request.url).pathname; // obtenemos la ruta de la solicitud HTTP entrante a partir de la URL proporcionada en el objeto request. Esto nos permite determinar qué acción tomar en función de la ruta solicitada y manejar las solicitudes de autenticación de manera adecuada.

  if (request.method === "GET" && path === "/api/auth/google") {
    return await startGoogleLogin();
  } // startGoogleLogin es una función que inicia el proceso de inicio de sesión con Google. Se llama cuando se recibe una solicitud GET en la ruta /api/auth/google. Esta función redirige al usuario a la página de inicio de sesión de Google, donde puede autenticarse y otorgar permisos a la aplicación. Una vez que el usuario complete el proceso de inicio de sesión, será redirigido de vuelta a la aplicación con un código de autorización que se utilizará para obtener un token de acceso y finalizar el inicio de sesión.
  if (request.method === "GET" && path === "/api/auth/google/callback") {
    return await finishGoogleLogin(request);
  } // finishGoogleLogin es una función que finaliza el proceso de inicio de sesión con Google. Se llama cuando se recibe una solicitud GET en la ruta /api/auth/google/callback, que es la URL de redirección configurada en la consola de desarrolladores de Google. Esta función recibe el código de autorización proporcionado por Google, lo intercambia por un token de acceso y obtiene la información del perfil del usuario. Luego, guarda o actualiza la información del usuario en la base de datos y crea una sesión para el usuario autenticado. Finalmente, devuelve una respuesta al cliente indicando que el inicio de sesión se ha completado correctamente.
  if (request.method === "GET" && path === "/api/auth/me") {
    return await requireAuth(request, getCurrentUser);
  }// getCurrentUser es una función que obtiene la información del usuario actualmente autenticado. Se llama cuando se recibe una solicitud GET en la ruta /api/auth/me, que es una ruta protegida que requiere autenticación. Esta función utiliza la sesión del usuario para identificarlo y recuperar su información de la base de datos. Si el usuario está autenticado, devuelve un objeto Response con los datos del usuario; de lo contrario, devuelve un error indicando que el usuario no está autorizado.
  if (request.method === "POST" && path === "/api/auth/logout") {
    return await requireAuth(request, () => logout(request));
  }// logout es una función que cierra la sesión del usuario actualmente autenticado. Se llama cuando se recibe una solicitud POST en la ruta /api/auth/logout, que es una ruta protegida que requiere autenticación. Esta función elimina la sesión del usuario de la base de datos y devuelve una respuesta al cliente indicando que la sesión se ha cerrado correctamente. Esto asegura que el usuario ya no tenga acceso a recursos protegidos hasta que vuelva a iniciar sesión.

  return null; // si ninguna de las rutas anteriores coincide con la solicitud entrante, devolvemos null para indicar que no se ha manejado la solicitud. Esto permite que otras funciones o middleware en la aplicación puedan manejar la solicitud si es necesario, y garantiza que solo las rutas de autenticación definidas sean procesadas por esta función.
} // authRoutes es una función que maneja las rutas de autenticación en la aplicación. Toma un objeto Request como parámetro y devuelve una promesa que resuelve a un objeto Response o null. La función verifica la ruta y el método de la solicitud entrante y llama a las funciones correspondientes para iniciar o finalizar el inicio de sesión con Google, obtener la información del usuario actual o cerrar la sesión del usuario. Si ninguna de las rutas coincide, devuelve null para permitir que otras funciones o middleware manejen la solicitud si es necesario. Esto asegura que solo las rutas de autenticación definidas sean procesadas por esta función y mantiene la seguridad y consistencia en toda la aplicación.
