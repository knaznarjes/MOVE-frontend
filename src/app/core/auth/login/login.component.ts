import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    errorMessage = '';
    loading = false;

    constructor(
        private readonly _formBuilder: FormBuilder,
        private readonly _authService: AuthService,
        private readonly _router: Router
    ) {
        this.loginForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    // -------------------------------------------------------------------------
    // Lifecycle hooks
    // -------------------------------------------------------------------------

    ngOnInit(): void {
        console.log('LoginComponent initialisé');
        console.log('État de connexion:', this._authService.isLoggedIn());

        if (this._authService.isLoggedIn()) {
            console.log('Redirection car déjà connecté');
            this._router.navigate(['/']);
        }
    }

    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------

    onSubmit(): void {
        if (this.loginForm.invalid) {
            return;
        }

        this.loading = true;
        this.errorMessage = '';

        const credentials = {
            email: this.loginForm.get('email')?.value,
            password: this.loginForm.get('password')?.value
        };

        this._authService.login(credentials)
            .subscribe({
                next: () => {
                    this.loading = false;
                    if (this._authService.isAdmin()) {
                        this._router.navigate(['/profile-admin']);
                    } else {
                        this._router.navigate(['/']);
                    }
                },
                error: (error) => {
                    this.loading = false;
                    this.errorMessage = error.message || 'Échec de la connexion';
                    console.error('Login error:', error);
                }
            });
    }

    // -------------------------------------------------------------------------
    // Getters
    // -------------------------------------------------------------------------

    // eslint-disable-next-line @typescript-eslint/member-ordering, @typescript-eslint/explicit-function-return-type
    get email() {
        return this.loginForm.get('email');
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering, @typescript-eslint/explicit-function-return-type
    get password() {
        return this.loginForm.get('password');
    }
}
