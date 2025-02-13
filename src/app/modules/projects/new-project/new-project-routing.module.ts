import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker'; // Add this
import { MatNativeDateModule } from '@angular/material/core'; // Add this (or MatMomentDateModule if using Moment.js)
import { FuseFindByKeyPipeModule } from '@fuse/pipes/find-by-key';
import { SharedModule } from 'app/shared/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { NewProjectComponent } from './new-project.component';

@NgModule({
    imports: [
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressBarModule,
        MatSelectModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatTooltipModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FuseFindByKeyPipeModule,
        SharedModule,
        MatTabsModule,
        RouterModule.forChild([{
            path: '',
            component: NewProjectComponent,
        }])
    ],
    exports: [RouterModule],
    declarations: [NewProjectComponent]
})
export class NewProjectRoutingModule { }
