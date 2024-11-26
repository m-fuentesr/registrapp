import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { IonModal } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home-docente',
  templateUrl: './home-docente.page.html',
  styleUrls: ['./home-docente.page.scss'],
})
export class HomeDocentePage implements OnInit {

  asignaturas: any[] = [];
  mostrarFormularioCrear = false;
  nuevaAsignatura = { nombre: '', secciones: {} };
  nuevaSeccion = { nombre: '' };

  profileMenuButtons = [
    {
      text: 'Perfil',
      icon: 'person-outline',
      handler: () => {
        this.router.navigate(['/perfil-docente']);
      }
    },
    {
      text: 'Cerrar sesión',
      icon: 'log-out-outline',
      handler: () => {
        this.router.navigate(['/inicio']);
      }
    },
    {
      text: 'Cancelar',
      icon: 'close',
      role: 'cancel'
    }
  ];


  constructor(
    private router: Router,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth,
    private storage: Storage
  ) {}

  ngOnInit() {
    this.initStorage();
    this.obtenerAsignaturas();
    Network.addListener('networkStatusChange', () => {
      this.sincronizarAsignaturas();
    });
  }

  private async initStorage() {
    await this.storage.create();
  }

  obtenerAsignaturas() {
    this.afAuth.currentUser.then(async user => {
      if (user) {
        const docenteId = user.uid;
  
        const status = await Network.getStatus();
        if (status.connected) {
          // En línea: Obtener datos de Firestore
          this.firestore.collection('asignaturas').snapshotChanges().subscribe((data: any) => {
            console.log('Todas las asignaturas:', data);
  
            const asignaturas = data
              .map((e: any) => {
                const asignatura = e.payload.doc.data();
                console.log('Asignatura:', asignatura);
  
                const seccionesFiltradas = Object.keys(asignatura.secciones).filter(seccionKey => {
                  const seccion = asignatura.secciones[seccionKey];
                  return seccion.docenteId === docenteId;
                }).map(seccionKey => asignatura.secciones[seccionKey]);
  
                if (seccionesFiltradas.length > 0) {
                  return {
                    id: e.payload.doc.id,
                    nombre: asignatura.nombre,
                    secciones: seccionesFiltradas,
                  };
                }
                return null;
              })
              .filter((asignatura: any) => asignatura !== null);
  
            this.asignaturas = asignaturas;
  
            // Guardar asignaturas en Ionic Storage
            this.storage.set('asignaturas', asignaturas).then(() => {
              console.log('Asignaturas guardadas localmente');
            });
          });
        } else {
          // Sin conexión: Cargar datos desde Ionic Storage
          this.storage.get('asignaturas').then(asignaturasOffline => {
            if (asignaturasOffline) {
              console.log('Datos cargados desde almacenamiento local:', asignaturasOffline);
              this.asignaturas = asignaturasOffline;
            } else {
              console.warn('No hay datos locales disponibles');
            }
          });
        }
      }
    }).catch(error => {
      console.error("Error al obtener el usuario:", error);
    });
  }
  
  cerrarFormularioCrear() {
    this.nuevaAsignatura = { nombre: '', secciones: {} };
    this.nuevaSeccion = { nombre: '' };
  }

  cerrarModal(modal: IonModal) {
    modal.dismiss();
    this.cerrarFormularioCrear();
  }

  crearAsignatura(modal?: IonModal) {
    this.afAuth.currentUser.then(async user => {
      if (user) {
        const docenteId = user.uid;
        const nuevaAsignaturaData = {
          nombre: this.nuevaAsignatura.nombre,
          secciones: {
            [this.nuevaSeccion.nombre]: {
              nombre: this.nuevaSeccion.nombre,
              docenteId: docenteId,
            }
          }
        };
  
        const status = await Network.getStatus();
        if (status.connected) {
          // En línea: Guardar directamente en Firestore
          this.firestore.collection('asignaturas').add(nuevaAsignaturaData)
            .then(() => {
              console.log('Asignatura creada con éxito en Firestore');
              this.nuevaAsignatura = { nombre: '', secciones: {} };
              this.nuevaSeccion = { nombre: '' };
              if (modal) {
                modal.dismiss().then(() => this.obtenerAsignaturas());
              } else {
                this.obtenerAsignaturas();
              }
            })
            .catch(error => {
              console.error('Error al crear asignatura:', error);
            });
        } else {
          // Sin conexión: Guardar localmente
          const asignaturasOffline = await this.storage.get('asignaturasOffline') || [];
          asignaturasOffline.push(nuevaAsignaturaData);
          await this.storage.set('asignaturasOffline', asignaturasOffline);
          console.log('Asignatura guardada localmente para sincronizar más tarde.');
          this.nuevaAsignatura = { nombre: '', secciones: {} };
          this.nuevaSeccion = { nombre: '' };
          if (modal) {
            modal.dismiss();
          }
        }
      }
    }).catch(error => {
      console.error('Error al obtener el usuario:', error);
    });
  }

  async sincronizarAsignaturas() {
    const status = await Network.getStatus();
    if (status.connected) {
      console.log('Conexión detectada. Sincronizando asignaturas...');
      const asignaturasOffline = await this.storage.get('asignaturasOffline'); // Asignaturas no sincronizadas
      if (asignaturasOffline && asignaturasOffline.length > 0) {
        for (const asignatura of asignaturasOffline) {
          try {
            // Subir asignatura a Firestore
            await this.firestore.collection('asignaturas').add({
              nombre: asignatura.nombre,
              secciones: asignatura.secciones,
            });
            console.log(`Asignatura "${asignatura.nombre}" sincronizada con éxito.`);
          } catch (error) {
            console.error('Error al sincronizar asignatura:', error);
          }
        }
        // Limpia las asignaturas locales después de sincronizarlas
        await this.storage.remove('asignaturasOffline');
        console.log('Asignaturas offline sincronizadas y eliminadas localmente.');
      }
    } else {
      console.log('Sin conexión. Sincronización pendiente.');
    }
  }
  

  navegarASeccion(asignaturaId: string, seccion: any) {
    this.router.navigate(['/asignaturas-docente'], { queryParams: { asignaturaId, seccion: seccion.nombre } });
  }
}
