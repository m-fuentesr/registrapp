import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-clase-actual',
  templateUrl: './clase-actual.page.html',
  styleUrls: ['./clase-actual.page.scss'],
})
export class ClaseActualPage implements OnInit {
  // Lista de alumnos con su estado de presencia
  alumnosPresentes = [
    { nombre: 'Matias Fuentes', presente: true },
    { nombre: 'Ignacio Sorko', presente: false },
    { nombre: 'Sebastian Monjes', presente: true },
    // Agrega más alumnos según sea necesario
  ];

  constructor() {}

  ngOnInit() {}
}