import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../../interfaces/menu-item';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  elementos:MenuItem[]=[
    {
      ruta:'/asignaturas',
      icono:'phone-portrait-outline',
      etiqueta:'Programación Móvil'
    },
    {
      ruta:'/asignaturas',
      icono:'laptop-outline',
      etiqueta:'Arquitectura de Software'
    },
    {
      ruta:'/asignaturas',
      icono:'stats-chart-outline',
      etiqueta:'Estadística'
    },
  ]

  constructor() { }

  ngOnInit() {
  }

}
