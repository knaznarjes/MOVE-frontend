import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="p-8 bg-white rounded-lg shadow-md text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">
          Accès Refusé
        </h1>
        <p class="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button
          (click)="goHome()"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Retour à l'accueil
        </button>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}
