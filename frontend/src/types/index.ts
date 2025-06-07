export interface Cliente {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface Avion {
  id: number;
  modelo: string;
  marca?: string;
  matricula: string;
  anio?: number;
}

export interface AvionConClientes {
  avion: Avion;
  duenios: Cliente[];
}
