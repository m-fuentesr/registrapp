import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-clase-actual',
  templateUrl: './clase-actual.page.html',
  styleUrls: ['./clase-actual.page.scss'],
})
export class ClaseActualPage implements OnInit {
  alumnosPresentes: any[] = [];
  claseSeleccionada: string = '';
  asignaturaId: string = ''; // Nueva variable para el ID de la asignatura

  constructor(
    private firestore: AngularFirestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.claseSeleccionada = params['claseSeleccionada'];
      this.asignaturaId = params['asignaturaId']; // Obtener el ID de la asignatura desde los parámetros
      this.obtenerAlumnosPresentes();
    });
  }

  async obtenerAlumnosPresentes() {
    this.firestore.collection('clase_actual').valueChanges().subscribe(async (alumnos: any[]) => {
      // Filtrar los alumnos que escanearon el QR para la clase y asignatura específicas
      const alumnosFiltrados = alumnos.filter(alumno => 
        alumno.clase === this.claseSeleccionada && alumno.asignaturaId === this.asignaturaId
      );

      // Obtener los nombres de cada alumno desde la colección "usuarios"
      const alumnosConNombre = await Promise.all(alumnosFiltrados.map(async (alumno) => {
        const usuarioDoc = await this.firestore.collection('usuarios').doc(alumno.alumnoId).get().toPromise();
        const usuarioData = usuarioDoc?.data();

        const nombreAlumno = usuarioData && (usuarioData as any).firstName && (usuarioData as any).lastName
          ? `${(usuarioData as any).firstName} ${(usuarioData as any).lastName}`
          : 'Alumno Desconocido';

        return { ...alumno, nombre: nombreAlumno };
      }));

      // Asignar la lista con los nombres obtenidos
      this.alumnosPresentes = alumnosConNombre;
    });
  }
}