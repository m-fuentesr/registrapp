import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from 'src/app/interfaces/usuario';

@Component({
  selector: 'app-login-docente',
  templateUrl: './login-docente.page.html',
  styleUrls: ['./login-docente.page.scss'],
})
export class LoginDocentePage implements OnInit {

  usr: Usuario={
    email:'',
    password:''
  }

  constructor(private router:Router) { }

  ngOnInit() {
  }

  iniciarSesion(){
    console.log("Subimit del formulario");
/*     if(this.usr.username=="waco" && this.usr.password=="123"){
      console.log('autorizado!!!'); */
      this.router.navigate(["/home-docente"])
    }
/*     else{
      console.log("Pa la casa!!!");
    } */

  }

// }

