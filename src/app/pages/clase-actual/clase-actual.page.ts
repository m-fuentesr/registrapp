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

  constructor(
    private firestore: AngularFirestore,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.claseSeleccionada = params['claseSeleccionada'];
      this.obtenerAlumnosPresentes();
    });
  }

  async obtenerAlumnosPresentes() {
    this.firestore.collection('clase_actual').valueChanges().subscribe(async (alumnos: any[]) => {
      // Filtrar solo los alumnos que escanearon el QR para la clase específica
      const alumnosFiltrados = alumnos.filter(alumno => alumno.clase === this.claseSeleccionada);

      // Para cada alumno filtrado, obtenemos su nombre desde la colección "usuarios"
      const alumnosConNombre = await Promise.all(alumnosFiltrados.map(async (alumno) => {
        const usuarioDoc = await this.firestore.collection('usuarios').doc(alumno.alumnoId).get().toPromise();
        const usuarioData = usuarioDoc?.data();

        const nombreAlumno = usuarioData && (usuarioData as any).firstName && (usuarioData as any).lastName
          ? `${(usuarioData as any).firstName} ${(usuarioData as any).lastName}`
          : 'Alumno Desconocido';

        return { ...alumno, nombre: nombreAlumno };
      }));

      // Asignamos la lista con los nombres obtenidos
      this.alumnosPresentes = alumnosConNombre;
    });
  }
}