export interface Usuario {
    uid?: string;
    firstName?: string;      
    lastName?: string;       
    email: string;          
    password: string;      
    confirmPassword?: string;
    [key: string]: any;
    tipo: 'alumno' | 'docente';
  }

  export interface FirestoreUsuario {
    uid?: string;
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