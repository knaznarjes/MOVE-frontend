// src/app/core/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    loginForm!: FormGroup;
    constructor(
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _router: Router
    ) {
        this.loginForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    ngOnInit(): void {
    }

    login(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this._authService.login(this.loginForm.value)
            .subscribe({
                next: () => {
                    this._router.navigate(['/home']);
                },
                error: (error) => {
                    console.error('Login error:', error);
                }
            });
    }
}
