import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';

import { DetailsComponent } from './details.component';
import { AddTaskModalComponent } from './task/add-task-modal/add-task-modal.component';
import { VersionDetailComponent } from './version-detail/version-detail.component';
import { ProjectDetailComponent } from './project-detail/project-detail.component';
import { VersionEditComponent } from './version-edit/version-edit.component';
import { ProjectEditComponent } from './project-edit/project-edit.component';
import { EditTaskModalComponent } from './task/add-task-modal/edit-task-modal.component';

const routes: Routes = [
  {
    path: '',
    component: DetailsComponent
  }
];

@NgModule({
  declarations: [
    DetailsComponent,
    AddTaskModalComponent,
    VersionDetailComponent,
    ProjectDetailComponent,
    VersionEditComponent,
    ProjectEditComponent,
    EditTaskModalComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
    MatSidenavModule
  ],
  exports: [RouterModule],
  entryComponents: [AddTaskModalComponent, EditTaskModalComponent]
})
export class DetailsModule { }
