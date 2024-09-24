import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-asignaturas-docente',
  templateUrl: './asignaturas-docente.page.html',
  styleUrls: ['./asignaturas-docente.page.scss'],
})
export class AsignaturasDocentePage implements OnInit {

  alumnos = [
    { nombre: 'Matías Fuentes', porcentajeAsistencia: 100, clasesAsistidas: 20 },
    { nombre: 'Sebastián Monjes', porcentajeAsistencia: 100, clasesAsistidas: 20 },
    { nombre: 'Ignacio Sorko', porcentajeAsistencia: 50, clasesAsistidas: 10 },
  ];

  constructor() { }

  ngOnInit() {
  }

}
