import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-asignaturas',
  templateUrl: './asignaturas.page.html',
  styleUrls: ['./asignaturas.page.scss'],
})
export class AsignaturasPage implements OnInit {
  alumnoId: string = '';
  clasesAsistidas: any[] = [];
  asignaturas: any[] = [];
  asignaturaId: string = '';
  seccion: any;
  totalClases: number = 0;
  porcentajeAsistencia: number = 0;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private route: ActivatedRoute,
    private storage: Storage
  ) { }

  async ngOnInit() {
    await this.initStorage();
    this.route.queryParams.subscribe(params => {
      console.log('params:', params);
      this.asignaturaId = params['asignaturaId'];
      this.seccion = params['seccionEspecifica'];
    });
    this.afAuth.authState.subscribe(async (user) => {
      if (user) {
        this.alumnoId = user.uid;
        console.log('Alumno ID:', this.alumnoId);
        await this.obtenerClasesAsistidas();
        await this.obtenerAsignaturas();
        await this.obtenerTotalClases();
        console.log(this.asignaturaId);
      }
    })
  }

  private async initStorage() {
    await this.storage.create();
  }

  async obtenerClasesAsistidas() {
    const status = await Network.getStatus();
    if (status.connected) {
      // Si hay conexión a Internet, obtener las clases asistidas desde Firestore
      this.firestore
        .collection('asistencia', (ref) => ref.where('alumnoId', '==', this.alumnoId))
        .valueChanges()
        .subscribe((asistencia: any[]) => {

          console.log('Clases Asistidas desde Firestore:', asistencia);

          // Almacenamos las clases asistidas del alumno
          this.clasesAsistidas = asistencia.flatMap((registro: any) =>
            registro.clasesAsistidas.map((clase: any) => ({
              asignaturaId: clase.asignaturaId,
              asignaturaNombre: clase.asignaturaNombre,
              nombre: clase.nombre,
              seccion: clase.seccion,
              fecha: clase.fecha,
            }))
          );
          this.storage.set('clasesAsistidasOffline', this.clasesAsistidas);
        });
    } else {
      // Si no hay conexión a Internet, cargar las clases asistidas desde el almacenamiento local
      const clasesAsistidasOffline = await this.storage.get('clasesAsistidasOffline');
      this.clasesAsistidas = clasesAsistidasOffline || [];
    }
  }

  async obtenerAsignaturas() {
    const status = await Network.getStatus();
    if (status.connected) {
      // Si hay conexión a Internet, obtenemos las asignaturas desde Firestore
      this.firestore
        .collection('asignaturas')
        .valueChanges()
        .subscribe((asignaturas: any[]) => {
          // Filtrar las asignaturas para incluir solo aquellas donde el alumno tiene clases asistidas
          this.asignaturas = asignaturas.filter((asignatura) =>
            Object.values(asignatura.secciones || {}).some((seccion: any) =>
              seccion.alumnos?.some((alumno: any) => alumno.alumnoId === this.alumnoId)
            )
          );
          this.storage.set('asignaturasOffline', this.asignaturas);
        });
    } else {
      // Si no hay conexión, intentar cargar las asignaturas desde el almacenamiento local
      const asignaturasOffline = await this.storage.get('asignaturasOffline');
      this.asignaturas = asignaturasOffline || [];
    }
  }

  async obtenerTotalClases() {
    const status = await Network.getStatus();
    if (status.connected) {
      // Si hay conexión a Internet, obtenemos todas las asignaturas de la colección
      this.firestore
        .collection('asignaturas')
        .snapshotChanges()
        .subscribe((asignaturas: any[]) => {
          // Filtrar las asignaturas y buscar la asignatura que corresponde a la asignaturaId
          const asignatura = asignaturas.find((doc: any) => doc.payload.doc.id === this.asignaturaId);

          if (asignatura) {
            const asignaturaData = asignatura.payload.doc.data();
            console.log('Asignatura desde Firestore:', asignaturaData);

            // Accedemos a la sección específica por su nombre
            const seccion = asignaturaData?.secciones?.[this.seccion];
            console.log('Sección:', seccion);

            if (seccion) {
              // Calcular el total de clases
              this.totalClases = seccion?.clases?.length || 0;
              this.storage.set('asignaturaOffline', asignaturaData);
            } else {
              console.error('Sección no encontrada');
            }
          } else {
            console.error('Asignatura no encontrada');
          }
        });

    } else {
      // Si no hay conexión, cargar datos desde almacenamiento local
      const asignaturaOffline = await this.storage.get('asignaturaOffline');
      const seccion = asignaturaOffline?.secciones?.[this.seccion];
      this.totalClases = seccion?.clases?.length || 0;
    }
  }
}