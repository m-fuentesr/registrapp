import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';

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

  qrCodeUrl: string = '';

  generarCodigoQR() {
    const datosClase = { 
      clase: 'Programación Móvil', 
      fecha: new Date().toISOString() 
    };
    
    QRCode.toDataURL(JSON.stringify(datosClase))
      .then(url => {
        this.qrCodeUrl = url;
        console.log('Código QR generado:', url);
      })
      .catch(err => {
        console.error('Error generando el código QR:', err);
      });
  }

}
