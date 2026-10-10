export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
} // User es una interfaz que define la estructura de un objeto de usuario en la aplicación. Contiene propiedades como id, googleId, email, name, picture y createdAt, que representan la información relevante del usuario. Esta interfaz se utiliza para garantizar que los objetos de usuario tengan la forma correcta y se puedan manipular de manera consistente en toda la aplicación.

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
} // GoogleProfile es una interfaz que define la estructura de un perfil de usuario de Google. Contiene propiedades como googleId, email, name, y picture, que representan la información relevante del usuario de Google. Esta interfaz se utiliza para garantizar que los objetos de perfil de usuario de Google tengan la forma correcta y se puedan manipular de manera consistente en toda la aplicación.
