import { Component, OnInit } from '@angular/core';
import * as QRCode from 'qrcode';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-asignaturas-docente',
  templateUrl: './asignaturas-docente.page.html',
  styleUrls: ['./asignaturas-docente.page.scss'],
})
export class AsignaturasDocentePage implements OnInit {

  alumnos: any[] = [];
  qrCodeUrl: string = '';

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.obtenerAlumnos();
  }

  async obtenerAlumnos() {
    this.firestore.collection('asistencia').valueChanges().subscribe((data: any) => {
      this.alumnos = data;
    });
  }

  generarCodigoQR() {
    const datosClase = { 
      nombre: 'a',
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