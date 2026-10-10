const port = Number(Deno.env.get("PORT") ?? "8000"); // obtenemos el valor de la variable de entorno PORT y lo convertimos a un número. Si no está definido, usamos 8000 como valor predeterminado.

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
} // verificamos que el valor de port sea un número entero entre 1 y 65535. Si no lo es, lanzamos un error.

export const env = {
  port,
  frontendOrigin: new URL(
    Deno.env.get("FRONTEND_ORIGIN") ?? "http://localhost:5173",
  ).origin,
  googleClientId: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
  googleClientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
  googleRedirectUri: Deno.env.get("GOOGLE_REDIRECT_URI") ??
    "http://localhost:8000/api/auth/google/callback",
  sessionDuration: 60 * 60 * 24, // duración de la sesión en segundos (1 día)
}; // exportamos un objeto env que contiene varias configuraciones de entorno, incluyendo el puerto del servidor, la URL de origen del frontend, las credenciales de Google OAuth y la duración de la sesión en segundos.
