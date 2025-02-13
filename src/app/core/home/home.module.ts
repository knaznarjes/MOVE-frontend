import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { InfoDialogComponent } from './info-dialog.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { homeRoutes } from './home.routing';

@NgModule({
    declarations: [
        HomeComponent,
        InfoDialogComponent
    ],
    imports: [
        CommonModule,
        RouterModule.forChild(homeRoutes),
        MatButtonModule,
        MatIconModule,
        MatDialogModule
    ]
})
export class HomeModule { }
