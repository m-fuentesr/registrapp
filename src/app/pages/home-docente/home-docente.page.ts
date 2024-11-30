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
  nuevaAsignatura = { id: null, nombre: '', secciones: {} };
  nuevaSeccion = { nombre: '' };
  nombreSeccionDuplicado = false;

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
  ) { }

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
    this.nuevaAsignatura = { id: null, nombre: '', secciones: {} };
    this.nuevaSeccion = { nombre: '' };
    this.nombreSeccionDuplicado = false;
  }

  cerrarModal(modal: IonModal) {
    modal.dismiss();
    this.cerrarFormularioCrear();
  }

  validarNombreSeccion() {
    if (this.nuevaAsignatura.id) {
      const asignatura = this.asignaturas.find(a => a.id === this.nuevaAsignatura.id);
      if (asignatura && asignatura.secciones.some((seccion: any) => seccion.nombre === this.nuevaSeccion.nombre)) {
        this.nombreSeccionDuplicado = true;
      } else {
        this.nombreSeccionDuplicado = false;
      }
    } else {
      this.nombreSeccionDuplicado = false;
    }
  }

  async crearAsignatura(modal?: IonModal) {
    this.afAuth.currentUser.then(async user => {
      if (user) {
        const docenteId = user.uid;

        const status = await Network.getStatus();
        if (status.connected) {
          if (this.nuevaAsignatura.id) {
            // Agregar una nueva sección a una asignatura existente
            const asignaturaRef = this.firestore.collection('asignaturas').doc(this.nuevaAsignatura.id);
            asignaturaRef.update({
              [`secciones.${this.nuevaSeccion.nombre}`]: {
                nombre: this.nuevaSeccion.nombre,
                docenteId: docenteId,
              },
            })
              .then(() => {
                console.log('Sección agregada con éxito');
                this.cerrarFormularioCrear();
                if (modal) modal.dismiss();
                this.obtenerAsignaturas();
              })
              .catch(error => {
                console.error('Error al agregar sección:', error);
              });
          } else {
            // Crear una nueva asignatura
            const nuevaAsignaturaData = {
              nombre: this.nuevaAsignatura.nombre,
              secciones: {
                [this.nuevaSeccion.nombre]: {
                  nombre: this.nuevaSeccion.nombre,
                  docenteId: docenteId,
                },
              },
            };
            this.firestore.collection('asignaturas').add(nuevaAsignaturaData)
              .then(() => {
                console.log('Asignatura creada con éxito');
                this.cerrarFormularioCrear();
                if (modal) modal.dismiss();
                this.obtenerAsignaturas();
              })
              .catch(error => {
                console.error('Error al crear asignatura:', error);
              });
          }
        } else {
          console.log('Sin conexión. Guardando localmente...');
          // Obtener asignaturas offline almacenadas localmente
          const asignaturasOffline = await this.storage.get('asignaturasOffline') || [];

          if (this.nuevaAsignatura.id) {
            // Agregar una nueva sección a una asignatura existente
            const asignaturaExistente = asignaturasOffline.find((a: any) => a.id === this.nuevaAsignatura.id);
            if (asignaturaExistente) {
              if (!asignaturaExistente.secciones) {
                asignaturaExistente.secciones = {};
              }
              asignaturaExistente.secciones[this.nuevaSeccion.nombre] = {
                nombre: this.nuevaSeccion.nombre,
                docenteId: docenteId,
              };
            } else {
              console.warn('Asignatura no encontrada en datos offline. Creando una nueva.');
              asignaturasOffline.push({
                id: this.nuevaAsignatura.id,
                nombre: this.nuevaAsignatura.nombre,
                secciones: {
                  [this.nuevaSeccion.nombre]: {
                    nombre: this.nuevaSeccion.nombre,
                    docenteId: docenteId,
                  },
                },
              });
            }
          } else {
            // Crear una nueva asignatura localmente
            const nuevaAsignaturaData = {
              id: Date.now().toString(), // Generar un ID único temporal
              nombre: this.nuevaAsignatura.nombre,
              secciones: {
                [this.nuevaSeccion.nombre]: {
                  nombre: this.nuevaSeccion.nombre,
                  docenteId: docenteId,
                },
              },
            };
            asignaturasOffline.push(nuevaAsignaturaData);
          }
          await this.storage.set('asignaturasOffline', asignaturasOffline);
          console.log('Asignatura/Sección guardada localmente:', asignaturasOffline);
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
            // Verificar si la asignatura ya existe en Firestore
            const asignaturaSnapshot = await this.firestore.collection('asignaturas', ref =>
              ref.where('nombre', '==', asignatura.nombre)
            ).get().toPromise();

            if (asignaturaSnapshot && asignaturaSnapshot?.docs.length > 0) {
              // Asignatura ya existe: agregar/actualizar secciones
              const firestoreAsignatura = asignaturaSnapshot.docs[0];
              const firestoreAsignaturaId = firestoreAsignatura.id;

              // Obtener los datos de Firestore
              const firestoreData = firestoreAsignatura.data();

              // Comprobar si firestoreData es un objeto y contiene la propiedad 'secciones'
              if (firestoreData && typeof firestoreData === 'object' && 'secciones' in firestoreData) {
                const firestoreSecciones = firestoreData.secciones;

                // Verificar que 'firestoreSecciones' y 'asignatura.secciones' son objetos
                if (typeof firestoreSecciones === 'object' && typeof asignatura.secciones === 'object') {
                  // Combinar secciones offline con las de Firestore
                  const nuevasSecciones = { ...firestoreSecciones, ...asignatura.secciones };

                  // Actualizar en Firestore
                  await this.firestore.collection('asignaturas').doc(firestoreAsignaturaId).update({
                    secciones: nuevasSecciones,
                  });
                  console.log(`Asignatura "${asignatura.nombre}" actualizada con nuevas secciones.`);
                } else {
                  console.error('Las secciones no son objetos válidos.');
                }
              } else {
                console.error('No se encontraron secciones en los datos de Firestore.');
              }
            } else {
              // Asignatura no existe: crear nueva
              await this.firestore.collection('asignaturas').add({
                nombre: asignatura.nombre,
                secciones: asignatura.secciones,
              });
              console.log(`Asignatura "${asignatura.nombre}" creada en Firestore.`);
            }
          } catch (error) {
            console.error(`Error al sincronizar la asignatura "${asignatura.nombre}":`, error);
            continue; // Pasar a la siguiente asignatura
          }
        }

        // Limpia las asignaturas locales después de sincronizarlas
        await this.storage.remove('asignaturasOffline');
        console.log('Asignaturas offline sincronizadas y eliminadas localmente.');
      } else {
        console.log('No hay asignaturas offline para sincronizar.');
      }
    } else {
      console.log('Sin conexión. Sincronización pendiente.');
    }
  }

  navegarASeccion(asignaturaId: string, seccion: any) {
    this.router.navigate(['/asignaturas-docente'], { queryParams: { asignaturaId, seccion: seccion.nombre } });
  }
}
