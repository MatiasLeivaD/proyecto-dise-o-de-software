import { env } from "../config/env.ts"; // importamos la variable env desde el archivo env.ts para poder acceder a las configuraciones de entorno de la aplicación, como la URL de redirección de Google y otros parámetros necesarios para la creación y lectura de cookies. Esto nos permite manejar las cookies de manera segura y consistente en toda la aplicación, adaptándonos a diferentes entornos de ejecución (desarrollo, producción, etc.).

export function readCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie")?.split(";") ?? []; // obtenemos las cookies de la solicitud HTTP entrante a partir de los encabezados de la solicitud. Si no hay cookies presentes, devolvemos un arreglo vacío. Esto nos permite manejar las cookies de manera segura y consistente en toda la aplicación, asegurándonos de que podamos leer las cookies proporcionadas por el cliente.

  for (const cookie of cookies) {
    const [cookieName, ...value] = cookie.trim().split("=");
    if (cookieName === name) return value.join("="); // si encontramos una cookie cuyo nombre coincide con el nombre proporcionado como argumento, devolvemos su valor. Esto nos permite leer el valor de una cookie específica de manera segura y consistente en toda la aplicación.
  } // iteramos sobre cada cookie en el arreglo de cookies y separamos el nombre de la cookie del valor utilizando el signo "=" como delimitador. Si encontramos una cookie cuyo nombre coincide con el nombre proporcionado como argumento, devolvemos su valor. Esto nos permite leer el valor de una cookie específica de manera segura y consistente en toda la aplicación.

  return null;
} // readCookie es una función que lee el valor de una cookie específica de la solicitud HTTP entrante. Toma como parámetros un objeto Request y el nombre de la cookie que se desea leer. La función obtiene las cookies de los encabezados de la solicitud, las separa en un arreglo y busca la cookie cuyo nombre coincida con el proporcionado. Si encuentra la cookie, devuelve su valor; de lo contrario, devuelve null. Esto nos permite manejar las cookies de manera segura y consistente en toda la aplicación, asegurándonos de que podamos leer las cookies proporcionadas por el cliente.

export function createCookie(
  name: string,
  value: string,
  maxAge: number,
): string {
  const secure = env.googleRedirectUri.startsWith("https://") ? "; Secure" : ""; // verificamos si la URL de redirección de Google comienza con "https://". Si es así, agregamos la opción "; Secure" a la cadena de la cookie para indicar que la cookie solo debe enviarse a través de conexiones seguras (HTTPS). Esto nos permite crear cookies seguras y consistentes en toda la aplicación, asegurándonos de que se manejen correctamente en diferentes entornos de ejecución (desarrollo, producción, etc.).
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`; // construimos la cadena de la cookie con el nombre, valor y tiempo de vida especificados, así como las opciones Path, HttpOnly, SameSite y Max-Age. Esto nos permite crear cookies seguras y consistentes en toda la aplicación, asegurándonos de que se manejen correctamente en diferentes entornos de ejecución (desarrollo, producción, etc.).
} // createCookie es una función que crea una cadena de texto que representa una cookie HTTP con el nombre, valor y tiempo de vida especificados. Toma como parámetros el nombre de la cookie, su valor y el tiempo de vida en segundos (maxAge). La función construye la cadena de la cookie con las opciones Path, HttpOnly, SameSite y Max-Age, y agrega la opción Secure si la URL de redirección de Google comienza con "https://". Esto nos permite crear cookies seguras y consistentes en toda la aplicación, asegurándonos de que se manejen correctamente en diferentes entornos de ejecución (desarrollo, producción, etc.).
