import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-clase-actual',
  templateUrl: './clase-actual.page.html',
  styleUrls: ['./clase-actual.page.scss'],
})
export class ClaseActualPage implements OnInit {
  alumnosPresentes: any[] = [];
  claseSeleccionada: string = '';

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.obtenerAlumnosPresentes();
  }

  obtenerAlumnosPresentes() {
    this.firestore.collection('clase_actual').valueChanges().subscribe((alumnos: any[]) => {
      // Filtrar solo los alumnos que escanearon el QR para la clase específica
      this.alumnosPresentes = alumnos.filter(alumno => alumno.clase === this.claseSeleccionada);
    });
  }
}