import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';  // Import CUSTOM_ELEMENTS_SCHEMA

import { AddDeveloperDialogComponent } from './developer-dialog/add-developer-dialog.component';
import { EditDeveloperDialogComponent } from './EditDeveloperDialog/edit-developer-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { PersonnelService } from './developers.service';
import { ListDevelopersComponent } from './list-developers/list-developers.component';

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
    ConfirmDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatChipsModule,
    MatAutocompleteModule,  MatChipsModule,
    MatIconModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Use a comma here
  providers: [PersonnelService]
})
export class DevelopersModule { }
