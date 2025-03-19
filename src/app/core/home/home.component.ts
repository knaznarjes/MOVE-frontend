/* eslint-disable @typescript-eslint/member-ordering */
import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { InfoDialogComponent } from './info-dialog.component';
import { AuthService } from '../services/auth.service';
// Ajustez ce chemin selon votre structure de projet

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
    constructor(
        private dialog: MatDialog,
        private router: Router,
        private _authService: AuthService
    ) { }

    openInfoDialog(): void {
        this.dialog.open(InfoDialogComponent, {
            width: '1000px',
            autoFocus: false,
            panelClass: 'info-dialog-container',
            disableClose: false
        });
    }

    navigateToLogin(): void {
        if (this._authService.isLoggedIn()) {
          this._authService.logout();
        }
        // Add a small delay to ensure logout completes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 100);
      }

    // Helper method to split text for styling first letters
    subtitleWords = 'Memories Organize Vacations Explore'.split(' ');
}
