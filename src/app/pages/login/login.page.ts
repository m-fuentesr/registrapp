import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';
import { StorageService } from 'src/app/services/dbstorage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit{

    usr: Usuario={
    email:'',
    password:'',
    tipo: 'alumno'
  }
  constructor(private router:Router, private dbstorage: StorageService) { }

  ngOnInit() {
  }

  async iniciarSesion() {
    console.log("Submit del formulario");

    // Recuperar el usuario almacenado
    const storedUser = await this.dbstorage.getUser();

    // Verificar si el usuario existe y las credenciales son correctas
    if (storedUser && storedUser.email === this.usr.email && storedUser.password === this.usr.password) {
      console.log('¡Autorizado!'); // Mensaje de éxito
      this.router.navigate(["/home"]); // Redirigir a la página de inicio
    } else {
      console.log("Credenciales incorrectas. Intente de nuevo."); // Mensaje de error
    }
  }

    recuperarPassword() {
      this.router.navigate(['/recuperar-password']);
      }

  }