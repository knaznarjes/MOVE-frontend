import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ListDevelopersComponent } from './list-developers.component';
import { AddDeveloperDialogComponent } from 'app/modules/developers/developer-dialog/add-developer-dialog.component';
import { EditDeveloperDialogComponent } from 'app/modules/developers/EditDeveloperDialog/edit-developer-dialog.component';
import { ConfirmDialogComponent } from 'app/modules/developers/confirm-dialog/confirm-dialog.component';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select'; // Import MatSelectModule
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';

const routes: Routes = [
  {
    path: '',
    component: ListDevelopersComponent
  }
];

@NgModule({
  declarations: [
    ListDevelopersComponent,
    AddDeveloperDialogComponent,
    EditDeveloperDialogComponent,
    ConfirmDialogComponent // Declare ConfirmDialogComponent here
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule, MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule
  ]
})
export class DevelopersModule { }
