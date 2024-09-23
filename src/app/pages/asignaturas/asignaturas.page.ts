import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-asignaturas',
  templateUrl: './asignaturas.page.html',
  styleUrls: ['./asignaturas.page.scss'],
})
export class AsignaturasPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  registrarAsistencia() {
    this.router.navigate(['/registrar-asistencia'])
  }
}
