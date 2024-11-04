import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Barcode, BarcodeScanner, ScanResult } from '@capacitor-mlkit/barcode-scanning';


@Component({
  selector: 'app-asignaturas',
  templateUrl: './asignaturas.page.html',
  styleUrls: ['./asignaturas.page.scss'],
})
export class AsignaturasPage implements OnInit {

  isSupported = false;
  barcodes: Barcode[] = [];
  isScanning: boolean = false;

  constructor(private router: Router) { }

  ngOnInit() {
    this.checkBarcodeScannerSupport(); // Verifica el soporte del escáner de códigos de barras
  }

  async checkBarcodeScannerSupport() {
    const result = await BarcodeScanner.isSupported();
    this.isSupported = result.supported;

    if (this.isSupported) {
      await BarcodeScanner.installGoogleBarcodeScannerModule(); // Instala el módulo de escaneo si es compatible
    }
  }

  async registrarAsistencia(): Promise<void> {
    const granted = await this.requestPermissions(); // Solicita permisos de cámara
    if (!granted) {
      return; 
    }
  
    this.isScanning = true; 
    const { barcodes } = await BarcodeScanner.scan(); // Escanea los códigos de barras
    this.barcodes.push(...barcodes); // Agrega los códigos escaneados al array
  
    //for (const barcode of this.barcodes) {
      //await this.processScannedValue(barcode.rawValue); // Procesa el valor escaneado
    //}
  
    this.isScanning = false; // Finaliza el escaneo
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions(); // Solicita permisos de cámara
    return camera === 'granted' || camera === 'limited';
  }
}
