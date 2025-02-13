import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;

    constructor(
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _router: Router
    ) {}

    ngOnInit(): void {
        this.registerForm = this._formBuilder.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            role: ['USER', Validators.required]
        });
    }

    register(): void {
        if (this.registerForm.invalid) {
            return;
        }

        this._authService.register(this.registerForm.value)
            .subscribe({
                next: () => {
                    this._router.navigate(['/login']);
                },
                error: (error) => {
                    console.error('Registration error:', error);
                }
            });
    }
}
