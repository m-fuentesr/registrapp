import { Asignatura, Seccion, Clase } from './../interfaces/asignatura';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { Network } from '@capacitor/network';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AsignaturaService {
  private asignaturas: Asignatura[] = [];

  constructor(private storage: Storage, private firestore: AngularFirestore) {
    this.initStorage();
    this.monitorNetworkStatus();
  }

  async initStorage() {
    await this.storage.create();
  }

  // Guardar asignaturas en el almacenamiento
  async guardarAsignatura(asignatura: Asignatura) {
    this.asignaturas.push(asignatura);
    await this.storage.set('asignaturas', this.asignaturas);
  }

  // Obtener todas las asignaturas
  async obtenerAsignaturas(): Promise<Asignatura[]> {
    const datos = await this.storage.get('asignaturas');
    this.asignaturas = datos || [];
    return this.asignaturas;
  }

  // Monitorea el estado de la red y sincroniza si vuelve la conexión
  async monitorNetworkStatus() {
    Network.addListener('networkStatusChange', async (status) => {
      if (status.connected) {
        await this.syncPendingData();
      }
    });
  }

  // Guarda los datos localmente si está sin conexión
  async guardarAsistenciaOffline(datosAsistencia: any) {
    const asistenciasPendientes = (await this.storage.get('asistenciasPendientes')) || [];
    asistenciasPendientes.push(datosAsistencia);
    await this.storage.set('asistenciasPendientes', asistenciasPendientes);
  }

  // Guarda el QR generado localmente si está sin conexión  qrPendientes
  async guardarQrOffline(qrData: any) {
    const qrPendientes = (await this.storage.get('qrPendientes')) || [];
    qrPendientes.push(qrData);
    await this.storage.set('qrPendientes', qrPendientes);
  }

  async obtenerAsignaturasOffline(): Promise<Asignatura[]> {
    const asignaturas = await this.storage.get('asignaturas');
    return asignaturas || [];
  }

  // Sincroniza los datos cuando hay conexión
  async syncPendingData() {
    const asistenciasPendientes = (await this.storage.get('asistenciasPendientes')) || [];
    const qrPendientes = (await this.storage.get('qrPendientes')) || [];

    for (const asistencia of asistenciasPendientes) {
      await this.firestore.collection('asistencia').doc(asistencia.alumnoId).set(asistencia);
    }
    for (const qr of qrPendientes) {
      await this.firestore.collection('clase_actual').add(qr);
    }

    // Limpiar almacenamiento local después de sincronizar
    await this.storage.remove('asistenciasPendientes');
    await this.storage.remove('qrPendientes');
  }
}

