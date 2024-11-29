import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Storage } from '@ionic/storage-angular';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-clase-actual',
  templateUrl: './clase-actual.page.html',
  styleUrls: ['./clase-actual.page.scss'],
})
export class ClaseActualPage implements OnInit {
  claseSeleccionada: any;
  asignaturaId: string = '';
  seccion: string = '';
  alumnosPresentes: any[] = []; // Alumnos que han asistido a la clase

  constructor(
    private route: ActivatedRoute,
    private firestore: AngularFirestore,
    private alertController: AlertController,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.storage.create();
    // Obtener los parámetros de la URL (asignatura y sección)
    this.route.queryParams.subscribe(params => {
      this.claseSeleccionada = params['claseSeleccionada'];
      this.asignaturaId = params['asignaturaId'];
      this.seccion = params['seccion'];
    });

    // Recuperar los alumnos presentes
    this.recuperarAlumnosPresentes();
  }

  async recuperarAlumnosPresentes() {
    try {
      // Consultar a la colección 'asistencia' para obtener los alumnos presentes en la clase actual
      const asistenciaRef = this.firestore.collection('asistencia')
      const querySnapshot = await asistenciaRef.get().toPromise();

      if (!querySnapshot || querySnapshot.empty) {
        await this.mostrarAlerta('No hay asistencia registrada', 'No hay alumnos registrados para esta clase aún.');
        return;
      }
      this.alumnosPresentes = [];

      for (const doc of querySnapshot.docs) {
        const alumnoId = doc.id;
        const alumnoData: any = doc.data();

        if (alumnoData.clasesAsistidas && Array.isArray(alumnoData.clasesAsistidas)) {
          // Filtrar las clases asistidas que coincidan con la asignatura y la sección
          const clasesFiltradas = alumnoData.clasesAsistidas.filter((clase: any) =>
            clase.asignaturaId === this.asignaturaId &&
            clase.nombre === this.claseSeleccionada &&
            clase.seccion === this.seccion
          );

          if (clasesFiltradas.length > 0) {
             // Obtener el ID del alumno desde la colección 'asistencia'
            const usuarioDoc = await this.firestore.collection('usuarios').doc(alumnoId).get().toPromise();

            if (usuarioDoc && usuarioDoc.exists && usuarioDoc.data()) {
              const usuarioData: any = usuarioDoc.data();
              alumnoData.firstName = usuarioData.firstName;
              alumnoData.lastName = usuarioData.lastName;
            }
          }

          if (alumnoData.firstName && alumnoData.lastName) {
            this.alumnosPresentes.push({ alumnoId: alumnoId, ...alumnoData });
          } else {
            console.warn('Alumno sin nombre o apellido:', alumnoId);
          }
        }
      }

      if (this.alumnosPresentes.length === 0) {
        await this.mostrarAlerta('No hay asistencia registrada', 'No hay alumnos registrados para esta clase aún.');
      }
    } catch (error) {
      console.error('Error al recuperar alumnos presentes:', error);
      await this.mostrarAlerta('Error', 'Ocurrió un error al recuperar la lista de alumnos presentes.');
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
