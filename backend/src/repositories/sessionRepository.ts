import { database } from "../config/database.ts"; // importamos la instancia de la base de datos desde el archivo database.ts para poder interactuar con la base de datos SQLite y realizar operaciones relacionadas con el almacenamiento y recuperación de sesiones. Esto nos permite guardar, buscar y eliminar sesiones en la base de datos, asegurando que las solicitudes de autenticación sean seguras y válidas.

export function saveSession(
  tokenHash: string,
  userId: string,
  expiresAt: number,
): void {
  database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(
    Date.now(), // eliminamos cualquier sesión que haya expirado (es decir, aquellas cuyo expires_at sea menor o igual a la hora actual) para mantener la base de datos limpia y evitar que se acumulen sesiones inválidas. Esto asegura que solo las sesiones válidas y no expiradas permanezcan en la base de datos.
  );
  database.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(tokenHash, userId, expiresAt); // insertamos un nuevo registro en la tabla sessions con el tokenHash proporcionado, el userId y el tiempo de expiración. Esto asegura que las sesiones sean válidas solo por un período limitado y ayuda a prevenir accesos no autorizados durante el proceso de autenticación.
}  // saveSession es una función que guarda una sesión en la base de datos. Toma como parámetros el tokenHash, el userId y el expiresAt, y realiza las siguientes acciones: primero, elimina cualquier sesión que haya expirado (es decir, aquellas cuyo expires_at sea menor o igual a la hora actual) para mantener la base de datos limpia y evitar que se acumulen sesiones inválidas. Luego, inserta un nuevo registro en la tabla sessions con el tokenHash proporcionado, el userId y el tiempo de expiración. Esto asegura que las sesiones sean válidas solo por un período limitado y ayuda a prevenir accesos no autorizados durante el proceso de autenticación.

export function findSessionUserId(tokenHash: string): string | null {
  const session = database.prepare(
    "SELECT user_id AS userId FROM sessions WHERE token_hash = ? AND expires_at > ?",
  ).get(tokenHash, Date.now()) as { userId: string } | undefined; // buscamos el registro correspondiente al tokenHash proporcionado en la tabla sessions de la base de datos. Si se encuentra un registro y la sesión aún es válida (es decir, su expires_at es mayor que la hora actual), lo almacenamos en la variable session; de lo contrario, session será undefined. Esto nos permite verificar si la sesión existe y obtener el userId asociado para su posterior validación y uso.

  return session?.userId ?? null; // retornamos el userId de la sesión encontrada si existe y es válida; de lo contrario, devolvemos null. Esto garantiza que solo se devuelva un userId para sesiones válidas y ayuda a prevenir accesos no autorizados durante el proceso de autenticación.
}

export function deleteSession(tokenHash: string): void {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
} // deleteSession es una función que elimina una sesión de la base de datos. Toma como parámetro el tokenHash y realiza la acción de eliminar el registro correspondiente en la tabla sessions. Esto asegura que la sesión ya no sea válida y ayuda a prevenir accesos no autorizados durante el proceso de autenticación.
