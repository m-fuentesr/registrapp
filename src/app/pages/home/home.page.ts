import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  asignaturas: any[] = []

  profileMenuButtons = [
    {
      text: 'Perfil',
      icon: 'person-outline',
      handler: () => {
        this.router.navigate(['/perfil']);
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
    private router : Router,
    private firestore: AngularFirestore,
    private afAuth: AngularFireAuth) { }

  ngOnInit() {
    this.obtenerAsignaturas();
  }

  obtenerAsignaturas() {
    this.afAuth.currentUser.then(user => {
      if (user) {
        const alumnoId = user.uid;
        this.firestore.collection('asignaturas').snapshotChanges().subscribe((data: any) => {
          console.log('Todas las asignaturas:', data);

          this.asignaturas = data
            .map((e: any) => {
              const asignatura = e.payload.doc.data();
              console.log('Asignatura:', asignatura);

              const seccionesFiltradas = Object.keys(asignatura.secciones).filter(seccionKey => {
                const seccion = asignatura.secciones[seccionKey];
                return seccion.alumnos && seccion.alumnos.some((alumno: any) => alumno.alumnoId === alumnoId);
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
    this.router.navigate(['/asignaturas'], { queryParams: { asignaturaId, seccion: seccion.nombre } });
  }
}
