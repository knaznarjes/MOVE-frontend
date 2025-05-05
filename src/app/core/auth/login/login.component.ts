// login.component.ts
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationRequest } from 'app/core/models/models';
import { AuthService } from 'app/core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: UntypedFormGroup;
  loading = false;
  errorMessage = '';
  redirectUrl: string | null = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Get redirect URL from route parameters or localStorage
    this.redirectUrl = localStorage.getItem('redirectUrl') || this.route.snapshot.queryParams['redirectUrl'];

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request: AuthenticationRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          // After login is successful and user info is stored, redirect based on role
          this.redirectBasedOnRole();
          localStorage.removeItem('redirectUrl');
        },
        error: (error) => {
          if (error.status === 401) {
            this.errorMessage = 'Invalid email or password';
          } else {
            this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          }
        }
      });
  }

  private redirectBasedOnRole(): void {
    // Get user role from the auth service
    const userRole = this.authService.getUserRole().toUpperCase();

    // If there's a stored redirect URL, use that first
    if (this.redirectUrl) {
      this.router.navigate([this.redirectUrl]);
      return;
    }

    // Otherwise, redirect based on role
    switch (userRole) {
      case 'MASTERADMIN':
        this.router.navigate(['/master/admin/profile']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin/profile']);
        break;
      case 'TRAVELER':
        this.router.navigate(['/profile']);
        break;
      default:
        // Fallback to home page if role doesn't match any expected values
        this.router.navigate(['/home']);
        break;
    }
  }
}
