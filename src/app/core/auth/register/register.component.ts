/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterRequest, Role } from 'app/core/models/models';
import { AuthService } from 'app/core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false; // Ajout d'un flag pour éviter les doubles soumissions

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    // Vérifier si le formulaire est valide et n'est pas déjà en cours de soumission
    if (this.registerForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true; // Marquer comme en cours de soumission
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: RegisterRequest = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: Role.TRAVELER
    };

    this.authService.register(request)
      .pipe(finalize(() => {
        this.loading = false;
        this.isSubmitting = false; // Réinitialiser le flag de soumission
      }))
      .subscribe({
        next: () => {
          console.log('Registration successful');
          this.successMessage = 'Inscription réussie! Vous allez être redirigé vers la page de connexion.';

          // Delay redirect to show success message
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { registered: 'success' }
            });
          }, 2000);
        },
        error: (error) => {
          console.error('Registration error:', error);
          if (error.status === 409) {
            this.errorMessage = 'Cet email est déjà utilisé.';
          } else {
            this.errorMessage = error.message || 'Une erreur est survenue lors de l\'inscription.';
          }
        }
      });
  }
}
