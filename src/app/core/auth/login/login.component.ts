import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthRequest } from 'app/core/models/models';
import { AuthService } from 'app/core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  redirectUrl: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
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
    this.redirectUrl = localStorage.getItem('redirectUrl') || this.route.snapshot.queryParams['redirectUrl'] || '/profile';

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate([this.redirectUrl]);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const request: AuthRequest = {  // Using the correct interface
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(request)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          // Navigate to the redirect URL and then clear it from localStorage
          this.router.navigate([this.redirectUrl]);
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
}
