import { database } from "../config/database.ts"; // importamos la instancia de la base de datos desde el archivo database.ts para poder interactuar con la base de datos SQLite y realizar operaciones relacionadas con el almacenamiento y recuperación de estados de OAuth. Esto nos permite guardar y consumir estados de OAuth en la base de datos, asegurando que las solicitudes de autenticación sean seguras y válidas.

interface OAuthState {
  nonce: string;
  codeVerifier: string;
  expiresAt: number;
} // definimos una interfaz OAuthState que representa la estructura de un estado de OAuth almacenado en la base de datos. Contiene propiedades como nonce, codeVerifier y expiresAt, que son necesarias para validar y consumir el estado de OAuth durante el proceso de autenticación. Esta interfaz se utiliza para garantizar que los objetos de estado de OAuth tengan la forma correcta y se puedan manipular de manera consistente en toda la aplicación.

export function saveOAuthState(
  state: string,
  nonce: string,
  codeVerifier: string,
): void {
  database.prepare("DELETE FROM oauth_states WHERE expires_at <= ?") // eliminamos cualquier estado de OAuth que haya expirado (es decir, aquellos cuyo expires_at sea menor o igual a la hora actual) para mantener la base de datos limpia y evitar que se acumulen estados inválidos. Esto asegura que solo los estados de OAuth válidos y no expirados permanezcan en la base de datos.
    .run(Date.now());
  database.prepare(`
    INSERT INTO oauth_states (state, nonce, code_verifier, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(state, nonce, codeVerifier, Date.now() + 10 * 60 * 1000); // insertamos un nuevo registro en la tabla oauth_states con el estado proporcionado, el nonce, el codeVerifier y un tiempo de expiración de 10 minutos a partir del momento actual. Esto asegura que los estados de OAuth sean válidos solo por un período limitado y ayuda a prevenir ataques de repetición durante el proceso de autenticación.
} // saveOAuthState es una función que guarda un estado de OAuth en la base de datos. Toma como parámetros el estado, el nonce y el codeVerifier, y realiza las siguientes acciones: primero, elimina cualquier estado de OAuth que haya expirado (es decir, aquellos cuyo expires_at sea menor o igual a la hora actual). Luego, inserta un nuevo registro en la tabla oauth_states con el estado proporcionado, el nonce, el codeVerifier y un tiempo de expiración de 10 minutos a partir del momento actual. Esto asegura que los estados de OAuth sean válidos solo por un período limitado y ayuda a prevenir ataques de repetición durante el proceso de autenticación.

export function consumeOAuthState(state: string): OAuthState | null {
  const savedState = database.prepare(`
    SELECT nonce, code_verifier AS codeVerifier, expires_at AS expiresAt
    FROM oauth_states WHERE state = ?
  `).get(state) as OAuthState | undefined; // buscamos el registro correspondiente al estado proporcionado en la tabla oauth_states de la base de datos. Si se encuentra un registro, lo almacenamos en la variable savedState; de lo contrario, savedState será undefined. Esto nos permite verificar si el estado de OAuth existe y obtener sus detalles (nonce, codeVerifier y expiresAt) para su posterior validación y consumo.

  database.prepare("DELETE FROM oauth_states WHERE state = ?").run(state); // eliminamos el registro correspondiente al estado proporcionado de la tabla oauth_states para asegurarnos de que el estado solo pueda ser utilizado una vez. Esto garantiza que los estados de OAuth sean de un solo uso y ayuda a prevenir ataques de repetición durante el proceso de autenticación.

  return savedState && savedState.expiresAt > Date.now() ? savedState : null;// verificamos si el estado encontrado aún es válido (es decir, si su expiresAt es mayor que la hora actual). Si es válido, devolvemos el objeto OAuthState correspondiente; de lo contrario, devolvemos null. Esto garantiza que los estados de OAuth sean de un solo uso y tengan un tiempo de vida limitado, mejorando la seguridad del proceso de autenticación.
} // consumeOAuthState es una función que consume un estado de OAuth previamente guardado en la base de datos. Toma como parámetro el estado y realiza las siguientes acciones: primero, busca el registro correspondiente en la tabla oauth_states utilizando el estado proporcionado. Luego, elimina ese registro de la base de datos para asegurarse de que el estado solo pueda ser utilizado una vez. Finalmente, verifica si el estado encontrado aún es válido (es decir, si su expiresAt es mayor que la hora actual). Si es válido, devuelve el objeto OAuthState correspondiente; de lo contrario, devuelve null. Esto garantiza que los estados de OAuth sean de un solo uso y tengan un tiempo de vida limitado, mejorando la seguridad del proceso de autenticación.
