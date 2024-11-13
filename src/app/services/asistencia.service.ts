import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore'; // Cambiado para compatibilidad
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsistenciaService {
  private asistenciaSubject = new BehaviorSubject<any>(null);
  asistenciaObservable = this.asistenciaSubject.asObservable();

  constructor(private firestore: AngularFirestore) {}

  actualizarAsistencia(datosAsistencia: any) {
    // Almacena en Firestore
    this.firestore.collection('asistencias').add(datosAsistencia)
      .then(() => console.log('Asistencia registrada en Firestore'))
      .catch(error => console.error('Error al registrar asistencia:', error));

    // Actualiza el Observable
    this.asistenciaSubject.next(datosAsistencia);
  }
}