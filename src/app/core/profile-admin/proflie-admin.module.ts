import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { profileAdminRoutes } from './profile-admin.routing';
import { ProfileAdminComponent } from './profile-admin.component';

@NgModule({
    declarations: [
        ProfileAdminComponent  // Make sure this is here

    ],
    imports: [
        CommonModule,
        RouterModule.forChild(profileAdminRoutes),
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatMenuModule,
        MatSnackBarModule    ]
})
export class ProfileAdminModule { }
