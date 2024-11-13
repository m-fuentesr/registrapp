import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-home-docente',
  templateUrl: './home-docente.page.html',
  styleUrls: ['./home-docente.page.scss'],
})
export class HomeDocentePage implements OnInit {

  asignaturas: any[] = [];

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
    private afAuth: AngularFireAuth) { }

  ngOnInit() {
    this.obtenerAsignaturas();
  }


  obtenerAsignaturas() {
    this.afAuth.currentUser.then(user => {
      if (user) {
        const docenteId = user.uid;
        this.firestore.collection('asignaturas').snapshotChanges().subscribe((data: any) => {
          console.log('Todas las asignaturas:', data);

          this.asignaturas = data
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
        });
      }
    }).catch(error => {
      console.error("Error al obtener el usuario:", error);
    });
  }

  navegarASeccion(asignaturaId: string, seccion: any) {
    this.router.navigate(['/asignaturas-docente'], { queryParams: { asignaturaId, seccion: seccion.nombre } });
  }
}
