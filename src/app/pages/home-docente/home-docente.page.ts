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
              this.asignaturas = asignaturasOffline.map((asignatura: any) => {
                return {
                  ...asignatura,
                  secciones: Object.values(asignatura.secciones || {}), // Convertir a array
                };
              });
              console.log('Datos cargados desde almacenamiento local:', asignaturasOffline);
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
            }

            this.cerrarFormularioCrear();
            if (modal) modal.dismiss();

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
          // Guardar las asignaturas offline
          await this.storage.set('asignaturasOffline', asignaturasOffline);

          // Combinar asignaturas offline con las sincronizadas de Firestore
          const asignaturasFirestore = await this.storage.get('asignaturas') || []; // Asignaturas previamente sincronizadas
          const asignaturasCombinadas = [...asignaturasFirestore, ...asignaturasOffline];

          // Evitar duplicados
          const asignaturasUnicas = asignaturasCombinadas.reduce((acc: any[], current: any) => {
            if (!acc.some(asignatura => asignatura.nombre === current.nombre)) {
              acc.push(current);
            }
            return acc;
          }, []);

          // Actualizar la lista de asignaturas localmente
          this.asignaturas = asignaturasUnicas.map(asignatura => ({
            ...asignatura,
            secciones: Object.values(asignatura.secciones || {}),
          }));
          await this.storage.set('asignaturas', this.asignaturas);

          console.log('Asignaturas combinadas guardadas localmente:', this.asignaturas);
          this.cerrarFormularioCrear();
          if (modal) modal.dismiss();
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

      // Obtener asignaturas offline almacenadas localmente
      const asignaturasOffline = await this.storage.get('asignaturasOffline') || [];

      if (asignaturasOffline.length > 0) {
        for (const asignatura of asignaturasOffline) {
          try {
            // Verificar si la asignatura ya existe en Firestore
            const asignaturaSnapshot = await this.firestore.collection('asignaturas', ref =>
              ref.where('nombre', '==', asignatura.nombre)
            ).get().toPromise();

            if (asignaturaSnapshot && asignaturaSnapshot.docs && asignaturaSnapshot.docs.length > 0) {
              // Si existe, obtener su ID y combinar secciones
              const firestoreAsignatura = asignaturaSnapshot.docs[0];
              const firestoreAsignaturaId = firestoreAsignatura.id;
              const firestoreData = firestoreAsignatura.data();

              if (firestoreData && typeof firestoreData === 'object' && 'secciones' in firestoreData) {
                const firestoreSecciones = firestoreData.secciones as Record<string, any>;
                const nuevasSecciones = { ...firestoreSecciones, ...asignatura.secciones };
                await this.firestore.collection('asignaturas').doc(firestoreAsignaturaId).update({
                  secciones: nuevasSecciones,
                });
                console.log(`Asignatura "${asignatura.nombre}" actualizada en Firestore.`);
              } else {
                console.error('Datos incorrectos al actualizar secciones en Firestore.');
              }
            } else {
              // Si no existe, crear nueva asignatura
              await this.firestore.collection('asignaturas').add({
                nombre: asignatura.nombre,
                secciones: asignatura.secciones,
              });
              console.log(`Asignatura "${asignatura.nombre}" creada en Firestore.`);
            }
          } catch (error) {
            console.error(`Error al sincronizar la asignatura "${asignatura.nombre}":`, error);
            continue; // Continuar con la siguiente asignatura
          }
        }

        // Eliminar asignaturas offline después de sincronizarlas
        await this.storage.remove('asignaturasOffline');
        console.log('Asignaturas offline sincronizadas y eliminadas localmente.');
      } else {
        console.log('No hay asignaturas offline para sincronizar.');
      }

      // Actualizar lista local con datos de Firestore después de sincronizar
      this.obtenerAsignaturas();
    } else {
      console.log('Sin conexión. Sincronización pendiente.');
    }
  }


  navegarASeccion(asignaturaId: string, seccion: any) {
    this.router.navigate(['/asignaturas-docente'], { queryParams: { asignaturaId, seccion: seccion.nombre } });
  }
}
