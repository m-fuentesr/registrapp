export interface Seccion {
    id: string;
    horaInicio: string;
    horaFin: string;
  }
  
  export interface Asignatura {
    id: string;
    nombre: string;
    ruta: string;
    secciones: Seccion[];
  }