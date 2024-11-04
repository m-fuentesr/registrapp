export interface Usuario {
    firstName?: string;      
    lastName?: string;       
    email: string;          
    password: string;      
    confirmPassword?: string;
    tipo: 'alumno' | 'docente';
  }

  export interface Alumno extends Usuario {
    tipo: 'alumno';
  }
  
  export interface Docente extends Usuario {
    tipo: 'docente';
  }