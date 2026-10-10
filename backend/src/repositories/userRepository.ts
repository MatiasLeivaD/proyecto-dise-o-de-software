import { database } from "../config/database.ts"; // importamos la instancia de la base de datos desde el archivo database.ts para poder interactuar con la base de datos SQLite y realizar operaciones relacionadas con el almacenamiento y recuperación de usuarios. Esto nos permite guardar, buscar y actualizar información de los usuarios en la base de datos, asegurando que las solicitudes de autenticación sean seguras y válidas.
import type { GoogleProfile, User } from "../models/user.ts"; // importamos los tipos GoogleProfile y User desde el archivo user.ts para poder usarlos en las funciones de este repositorio y asegurarnos de que los objetos de usuario tengan la estructura correcta. Esto nos permite trabajar con perfiles de Google y usuarios en general de manera consistente y segura en toda la aplicación.

const userColumns = `
  id, google_id AS googleId, email, name, picture, created_at AS createdAt
`; // definimos una constante userColumns que contiene los nombres de las columnas de la tabla users en la base de datos, con alias para que coincidan con las propiedades de la interfaz User. Esto nos permite seleccionar y mapear fácilmente los datos de los usuarios desde la base de datos a objetos de tipo User en nuestra aplicación.

export function findUserById(id: string): User | null {
  return database.prepare(`SELECT ${userColumns} FROM users WHERE id = ?`) // preparamos una consulta SQL para seleccionar las columnas definidas en userColumns de la tabla users donde el id coincida con el proporcionado. Esto nos permite buscar un usuario específico en la base de datos por su id.
    .get(id) as User | undefined ?? null; // si se encuentra un registro, lo devolvemos como un objeto de tipo User; de lo contrario, devolvemos null. Esto nos permite obtener información de un usuario específico de manera segura y consistente en toda la aplicación.
} // findUserById es una función que busca un usuario en la base de datos por su id. Toma como parámetro el id del usuario y realiza una consulta SQL para seleccionar las columnas definidas en userColumns de la tabla users donde el id coincida con el proporcionado. Si se encuentra un registro, lo devuelve como un objeto de tipo User; de lo contrario, devuelve null. Esto nos permite obtener información de un usuario específico de manera segura y consistente en toda la aplicación.

export function saveGoogleUser(profile: GoogleProfile): User {
  const existingUser = database.prepare(
    `SELECT ${userColumns} FROM users WHERE google_id = ?`, // preparamos una consulta SQL para seleccionar las columnas definidas en userColumns de la tabla users donde el google_id coincida con el proporcionado. Esto nos permite buscar un usuario existente en la base de datos por su googleId antes de intentar guardarlo o actualizarlo.
  ).get(profile.googleId) as User | undefined; // buscamos un usuario existente en la base de datos por su googleId. Si se encuentra un registro, lo almacenamos en la variable existingUser; de lo contrario, existingUser será undefined. Esto nos permite verificar si el usuario ya existe en la base de datos antes de intentar guardarlo o actualizarlo.

  const user: User = {
    id: existingUser?.id ?? crypto.randomUUID(), // si el usuario ya existe, usamos su id existente; de lo contrario, generamos un nuevo id único utilizando crypto.randomUUID(). Esto nos permite garantizar que cada usuario tenga un identificador único en la base de datos, ya sea que se trate de un usuario nuevo o uno existente.
    createdAt: existingUser?.createdAt ?? new Date().toISOString(),// si el usuario ya existe, usamos su fecha de creación existente; de lo contrario, establecemos la fecha de creación como la fecha y hora actual en formato ISO. Esto nos permite mantener un registro preciso de cuándo se creó cada usuario en la base de datos, ya sea que se trate de un usuario nuevo o uno existente.
    ...profile,
  };// ...profile es un operador de propagación que copia todas las propiedades del objeto profile (googleId, email, name y picture) en el objeto user. Esto nos permite crear un objeto user completo que contenga toda la información relevante del perfil de Google del usuario, ya sea que se trate de un usuario nuevo o uno existente.
  database.prepare(`
    INSERT INTO users (id, google_id, email, name, picture, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(google_id) DO UPDATE SET
      email = excluded.email,
      name = excluded.name,
      picture = excluded.picture
  `).run(
    user.id,
    user.googleId,
    user.email,
    user.name,
    user.picture,
    user.createdAt,
  ); // ejecutamos la consulta SQL preparada para insertar un nuevo registro en la tabla users con los valores del objeto user. Si ya existe un usuario con el mismo google_id, actualizamos sus campos email, name y picture con los valores proporcionados. Esto nos permite guardar o actualizar la información del usuario de manera segura y consistente en toda la aplicación.

  return user;
} // saveGoogleUser es una función que guarda o actualiza un usuario en la base de datos utilizando la información de su perfil de Google. Toma como parámetro un objeto profile de tipo GoogleProfile y realiza las siguientes acciones: primero, busca un usuario existente en la base de datos por su googleId. Si se encuentra un registro, lo almacena en la variable existingUser; de lo contrario, existingUser será undefined. Luego, crea un objeto user que contiene un id único (ya sea existente o generado), la fecha de creación (ya sea existente o actual) y todas las propiedades del perfil de Google. Finalmente, ejecuta una consulta SQL para insertar un nuevo registro en la tabla users con los valores del objeto user, o actualizar los campos email, name y picture si ya existe un usuario con el mismo google_id. Esto nos permite guardar o actualizar la información del usuario de manera segura y consistente en toda la aplicación.
