import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../../interfaces/menu-item';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-docente',
  templateUrl: './home-docente.page.html',
  styleUrls: ['./home-docente.page.scss'],
})
export class HomeDocentePage implements OnInit {

  elementos: MenuItem[] = [
    {
      ruta: '/asignaturas-docente',
      icono: 'phone-portrait-outline',
      etiqueta: 'Programación Móvil',
      secciones: ['Sección 001-D', 'Sección 002-D', 'Sección 003-D']
    },
    {
      ruta: '/asignaturas-docente',
      icono: 'laptop-outline',
      etiqueta: 'Arquitectura de Software',
      secciones: ['Sección 001-D', 'Sección 002-D']
    },
    {
      ruta: '/asignaturas-docente',
      icono: 'stats-chart-outline',
      etiqueta: 'Estadística',
      secciones: ['Sección 001-D',]
    },
  ];

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
  

  constructor(private router : Router) { }

  ngOnInit() {
  }

  navegarASeccion(ruta: string, seccion: string) {
    this.router.navigate([ruta], { queryParams: { seccion: seccion } });
  }
}
