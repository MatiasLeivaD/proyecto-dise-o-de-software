import { app } from "../src/app.ts"; // importamos la función app desde el archivo app.ts para poder utilizarla como punto de entrada principal de la aplicación y manejar las solicitudes HTTP entrantes. Esta función se encarga de procesar las rutas de autenticación, verificar el estado de la aplicación y manejar posibles errores, garantizando una experiencia de usuario segura y confiable.
import { database } from "../src/config/database.ts"; // importamos la variable database desde el archivo database.ts para poder acceder a la base de datos de la aplicación y realizar operaciones de lectura y escritura en las tablas correspondientes. Esto nos permite interactuar con los datos almacenados en la base de datos, como usuarios, sesiones y estados de OAuth, garantizando una gestión eficiente y segura de la información en toda la aplicación.
import { env } from "../src/config/env.ts"; // importamos la variable env desde el archivo env.ts para poder acceder a las configuraciones de entorno de la aplicación, como el puerto en el que se ejecutará el servidor y otros parámetros necesarios para la correcta ejecución de la aplicación. Esto nos permite adaptar la aplicación a diferentes entornos de ejecución (desarrollo, producción, etc.) y garantizar su correcto funcionamiento.
import {
  consumeOAuthState,
  saveOAuthState,
} from "../src/repositories/oauthRepository.ts"; // importamos las funciones consumeOAuthState y saveOAuthState desde el archivo oauthRepository.ts para poder interactuar con la base de datos y realizar operaciones relacionadas con el almacenamiento y consumo de estados de OAuth. Esto nos permite gestionar los estados de OAuth de manera segura y consistente en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
import { saveGoogleUser } from "../src/repositories/userRepository.ts"; // importamos la función saveGoogleUser desde el archivo userRepository.ts para poder guardar usuarios autenticados a través de Google en la base de datos. Esto nos permite gestionar los usuarios de manera segura y consistente en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.
import { createSession } from "../src/services/sessionService.ts"; // importamos la función createSession desde el archivo sessionService.ts para poder crear sesiones de usuario en la base de datos. Esto nos permite gestionar las sesiones de manera segura y consistente en toda la aplicación, asegurando que las solicitudes de autenticación sean válidas y confiables.

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message); // si la condición proporcionada es falsa, lanzamos un error con el mensaje especificado. Esto nos permite realizar comprobaciones de validación en el código y garantizar que las condiciones esperadas se cumplan durante la ejecución de las pruebas, facilitando la detección de errores y problemas en la aplicación.
} // assert es una función que verifica si una condición es verdadera. Si la condición es falsa, lanza un error con el mensaje proporcionado. Esto nos permite realizar comprobaciones de validación en el código y garantizar que las condiciones esperadas se cumplan durante la ejecución de las pruebas, facilitando la detección de errores y problemas en la aplicación.

Deno.test("protected endpoint rejects a missing session", async () => {
  const response = await app(new Request("http://localhost:8000/api/auth/me")); // realizamos una solicitud HTTP a la ruta /api/auth/me utilizando la función app, que maneja las solicitudes entrantes y devuelve una respuesta. Esta prueba verifica si un endpoint protegido rechaza correctamente una solicitud sin sesión, asegurando que solo los usuarios autenticados puedan acceder a la información del usuario actual.
  assert(response.status === 401, "Expected status 401."); // verificamos si el estado de la respuesta es 401 (No autorizado). Si la condición no se cumple, lanzamos un error con el mensaje "Expected status 401.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que los endpoints protegidos de nuestra aplicación funcionen correctamente y manejen adecuadamente las solicitudes sin sesión.
}); // Deno.test es una función proporcionada por Deno que nos permite definir y ejecutar pruebas unitarias en nuestra aplicación. En este caso, estamos definiendo una prueba que verifica si un endpoint protegido rechaza una solicitud sin sesión. La prueba realiza una solicitud HTTP a la ruta /api/auth/me y comprueba si la respuesta tiene un estado 401 (No autorizado). Si la condición no se cumple, se lanza un error con el mensaje "Expected status 401.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que los endpoints protegidos de nuestra aplicación funcionen correctamente y manejen adecuadamente las solicitudes sin sesión.

Deno.test("Google callback rejects an unbound state", async () => {
  const response = await app(
    new Request(
      "http://localhost:8000/api/auth/google/callback?state=invalid&code=invalid",
    ),
  );
  assert(response.status === 302, "Expected a redirect to sign-in.");
  assert(
    response.headers.get("location") ===
      `${env.frontendOrigin}/?authError=invalid_state`,
    "Invalid state was accepted.",
  );
  assert(
    !response.headers.get("set-cookie")?.includes("session="),
    "Invalid callback created a session.",
  );
}); // probamos que la ruta de callback de Google rechaza un estado no vinculado. Realizamos una solicitud HTTP a la ruta /api/auth/google/callback con parámetros de estado y código inválidos. Verificamos que la respuesta tenga un estado 302 (Redirección) y que la ubicación de redirección sea la página de inicio de sesión con un error de autenticación. Además, comprobamos que no se haya creado una cookie de sesión. Esto nos permite garantizar que la aplicación maneje correctamente los estados no válidos durante el proceso de autenticación con Google.

Deno.test("OAuth state can be used only once and expires", () => {
  const state = crypto.randomUUID();
  const expiredState = crypto.randomUUID();
  saveOAuthState(state, "nonce", "verifier");
  assert(consumeOAuthState(state)?.nonce === "nonce", "Expected valid state.");
  assert(consumeOAuthState(state) === null, "State must be single-use.");

  saveOAuthState(expiredState, "nonce", "verifier");
  database.prepare("UPDATE oauth_states SET expires_at = 0 WHERE state = ?")
    .run(expiredState);
  assert(
    consumeOAuthState(expiredState) === null,
    "Expired state was accepted.",
  );
}); // y aqui probamos que el estado de OAuth solo se puede usar una vez y expira correctamente. Generamos dos estados aleatorios, uno válido y otro expirado. Guardamos ambos estados en la base de datos utilizando la función saveOAuthState. Luego, verificamos que el estado válido se pueda consumir correctamente y que no se pueda consumir nuevamente (debe ser de un solo uso). Para el estado expirado, actualizamos su tiempo de expiración en la base de datos a 0 y comprobamos que no se pueda consumir. Esto nos permite garantizar que los estados de OAuth sean seguros y tengan un tiempo de vida limitado, mejorando la seguridad del proceso de autenticación.

Deno.test("session survives requests and logout revokes it", async () => {
  const googleId = `test-${crypto.randomUUID()}`;
  const user = saveGoogleUser({
    googleId,
    email: "test@example.com",
    name: "Test User",
    picture: null,
  }); // creamos un usuario de prueba utilizando la función saveGoogleUser con un googleId único generado aleatoriamente. Esto nos permite tener un usuario de prueba en la base de datos para realizar pruebas de sesión y autenticación, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.

  try {
    const sameUser = saveGoogleUser({
      googleId,
      email: "updated@example.com",
      name: "Updated User",
      picture: null,
    }); // actualizamos el mismo usuario de prueba utilizando la función saveGoogleUser con el mismo googleId pero con información actualizada (correo electrónico y nombre). Esto nos permite verificar que la función saveGoogleUser actualiza correctamente la información del usuario existente en la base de datos, asegurando que los cambios se reflejen en las solicitudes de autenticación posteriores.
    assert(sameUser.id === user.id, "Repeated login created another user.");

    const token = await createSession(user.id); // creamos una sesión para el usuario de prueba utilizando la función createSession y generamos un token de sesión. Esto nos permite simular una sesión de usuario autenticado en la aplicación y realizar solicitudes autenticadas a los endpoints protegidos, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    const cookie = `session=${token}`; // creamos una cookie de sesión utilizando el token generado por la función createSession. Esto nos permite incluir la cookie de sesión en los encabezados de las solicitudes HTTP para simular un usuario autenticado y verificar que la sesión persista entre solicitudes, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    const authenticatedRequest = () => // creamos una función que devuelve una nueva solicitud HTTP autenticada a la ruta /api/auth/me, incluyendo la cookie de sesión en los encabezados. Esto nos permite realizar solicitudes autenticadas a la aplicación y verificar que la sesión del usuario persista entre solicitudes, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
      new Request("http://localhost:8000/api/auth/me", {
        headers: { cookie },
      }); // creamos una sesión para el usuario de prueba utilizando la función createSession y generamos un token de sesión. Luego, construimos una solicitud autenticada a la ruta /api/auth/me incluyendo la cookie de sesión en los encabezados. Esto nos permite realizar solicitudes autenticadas a la aplicación y verificar que la sesión del usuario persista entre solicitudes, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.

    const firstResponse = await app(authenticatedRequest()); // realizamos la primera solicitud autenticada a la ruta /api/auth/me utilizando la función app y la solicitud construida previamente. Esto nos permite verificar que la sesión del usuario persista entre solicitudes y que la información del usuario se obtenga correctamente, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    assert(firstResponse.status === 200, "Valid session was rejected."); // verificamos si el estado de la primera respuesta es 200 (OK). Si la condición no se cumple, lanzamos un error con el mensaje "Valid session was rejected.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la sesión del usuario persista entre solicitudes y que la información del usuario se obtenga correctamente, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    const data = await firstResponse.json(); // parseamos la respuesta de la primera solicitud autenticada a JSON para obtener los datos del usuario. Esto nos permite acceder a la información del usuario devuelta por el endpoint protegido y verificar que los datos sean correctos, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    assert(
      data.user.email === "updated@example.com",
      "Profile was not updated.",
    ); // verificamos si el correo electrónico del usuario devuelto en los datos de la primera respuesta es "
    const secondResponse = await app(authenticatedRequest()); // realizamos la segunda solicitud autenticada a la ruta /api/auth/me utilizando la función app y la misma solicitud construida previamente. Esto nos permite verificar que la sesión del usuario persista entre solicitudes y que la información del usuario se obtenga correctamente, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    assert(secondResponse.status === 200, "Second request lost the session."); // verificamos si el estado de la segunda respuesta es 200 (OK). Si la condición no se cumple, lanzamos un error con el mensaje "Second request lost the session.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la sesión del usuario persista entre solicitudes y que la información del usuario se obtenga correctamente, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.

    const blockedLogout = await app(
      new Request("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: { cookie, origin: "http://untrusted.example" },
      }), // realizamos una solicitud de cierre de sesión a la ruta /api/auth/logout utilizando la función app y una solicitud construida con un origen no confiable. Esto nos permite verificar que la aplicación rechace correctamente los intentos de cierre de sesión desde orígenes no confiables, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    ); // verificamos si el estado de la respuesta de cierre de sesión desde un origen no confiable es 403 (Prohibido). Si la condición no se cumple, lanzamos un error con el mensaje "Logout accepted an untrusted origin.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la aplicación maneje correctamente los intentos de cierre de sesión desde orígenes no confiables y mantenga la seguridad de las sesiones de usuario.
    assert(
      blockedLogout.status === 403,
      "Logout accepted an untrusted origin.",
    ); // verificamos si el estado de la respuesta de cierre de sesión desde un origen no confiable es 403 (Prohibido). Si la condición no se cumple, lanzamos un error con el mensaje "Logout accepted an untrusted origin.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la aplicación maneje correctamente los intentos de cierre de sesión desde orígenes no confiables y mantenga la seguridad de las sesiones de usuario.

    const logoutResponse = await app(
      new Request("http://localhost:8000/api/auth/logout", {
        method: "POST",
        headers: { cookie, origin: env.frontendOrigin },
      }), // realizamos una solicitud de cierre de sesión a la ruta /api/auth/logout utilizando la función app y una solicitud construida con un origen confiable (el valor de env.frontendOrigin). Esto nos permite verificar que la aplicación permita correctamente los intentos de cierre de sesión desde orígenes confiables, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas. 
    ); // realizamos una solicitud de cierre de sesión a la ruta /api/auth/logout utilizando la función app y una solicitud construida con un origen confiable (el valor de env.frontendOrigin). Esto nos permite verificar que la aplicación permita correctamente los intentos de cierre de sesión desde orígenes confiables, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    assert(logoutResponse.status === 200, "Logout failed.");
    assert(
      (await app(authenticatedRequest())).status === 401,
      "Revoked session was accepted.",
    ); // verificamos si el estado de la respuesta de cierre de sesión desde un origen confiable es 200 (OK). Si la condición no se cumple, lanzamos un error con el mensaje "Logout failed.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la aplicación maneje correctamente los intentos de cierre de sesión desde orígenes confiables y mantenga la seguridad de las sesiones de usuario. Además, realizamos una solicitud autenticada nuevamente a la ruta /api/auth/me para verificar que la sesión haya sido revocada correctamente y que el estado de la respuesta sea 401 (No autorizado). Si la condición no se cumple, lanzamos un error con el mensaje "Revoked session was accepted.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que las sesiones revocadas no sean aceptadas y que la seguridad de las sesiones de usuario se mantenga en toda la aplicación.

    const expiredToken = await createSession(user.id);
    database.prepare("UPDATE sessions SET expires_at = 0 WHERE user_id = ?")
      .run(user.id);
    const expiredResponse = await app(
      new Request("http://localhost:8000/api/auth/me", {
        headers: { cookie: `session=${expiredToken}` },
      }),
    ); // realizamos una solicitud autenticada a la ruta /api/auth/me utilizando la función app y una solicitud construida con un token de sesión expirado. Esto nos permite verificar que la aplicación rechace correctamente las solicitudes autenticadas con sesiones expiradas, asegurando que las solicitudes de autenticación sean válidas y confiables durante las pruebas.
    assert(expiredResponse.status === 401, "Expired session was accepted."); // verificamos si el estado de la respuesta de la solicitud autenticada con un token de sesión expirado es 401 (No autorizado). Si la condición no se cumple, lanzamos un error con el mensaje "Expired session was accepted.", lo que indica que la prueba ha fallado. Esto nos permite garantizar que la aplicación maneje correctamente las solicitudes autenticadas con sesiones expiradas y mantenga la seguridad de las sesiones de usuario en toda la aplicación.
  } finally {
    database.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  } // eliminamos el usuario de prueba de la base de datos utilizando una consulta SQL DELETE para mantener la base de datos limpia después de las pruebas. Esto nos permite garantizar que los datos de prueba no interfieran con otras pruebas o con el funcionamiento normal de la aplicación, asegurando un entorno de prueba consistente y confiable.
}); // y finalmente probamos que la sesión de usuario persiste entre solicitudes y que el cierre de sesión la revoca correctamente. Creamos un usuario de prueba utilizando saveGoogleUser y luego creamos una sesión para ese usuario con createSession. Realizamos varias solicitudes autenticadas a la ruta /api/auth/me para verificar que la sesión sea válida y que los datos del usuario se actualicen correctamente. También probamos que un intento de cierre de sesión desde un origen no confiable sea rechazado, mientras que un cierre de sesión desde el origen confiable funcione correctamente y revoque la sesión. Además, verificamos que una sesión expirada no sea aceptada. Finalmente, eliminamos el usuario de prueba de la base de datos para mantenerla limpia. Esto nos permite garantizar que la gestión de sesiones en nuestra aplicación funcione correctamente y sea segura.
