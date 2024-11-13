import { Docente } from './usuario';

export interface Clase {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
}

export interface Seccion {
  id: string;
  docente: Docente;
  clases: Clase[];
}
  
export interface Asignatura {
  id: string;
  nombre: string;
  ruta: string;
  secciones: Seccion[];
}