import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
})
export class AsistenciaPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  asignaturas = [
    { nombre: 'Programación Móvil', porcentajeAsistencia: 100, clasesAsistidas: 20 },
    { nombre: 'Arquitectura de Software', porcentajeAsistencia: 100, clasesAsistidas: 20 },
    { nombre: 'Estadística', porcentajeAsistencia: 50, clasesAsistidas: 10 },
  ];

}
