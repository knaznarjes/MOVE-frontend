import { Component, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { InfoDialogComponent } from './info-dialog.component';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent {
    constructor(
        private dialog: MatDialog,
        private router: Router
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
        this.router.navigate(['/login']);
    }

    // Helper method to split text for styling first letters
    subtitleWords = 'Memories Organize Vacations Explore'.split(' ');
}
