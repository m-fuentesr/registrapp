import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage {

  constructor(private router: Router, private alertController: AlertController) {}


  modificarPassword() {

    this.router.navigate(['/modificar-password']); 
  }
}