import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContentService } from 'app/core/services/content.service';
import { LocationService } from 'app/core/services/location.service';
import { ContentDetailsModule } from './contents/content-details/content-details.module';
import { ContentFormModule } from './contents/content-form/content-form.module';
import { ContentHomeModule } from './contents/content-home/content-home.module';
import { DayProgramService } from '../services/day-program.service';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MediaService } from 'app/core/services/media.service';
import { ActivityPointService } from 'app/core/services/activity-point.service';
import { NotificationModule } from './notification/notification.module';

@NgModule({
  imports: [
    CommonModule,
    ContentHomeModule,
    ContentFormModule,
    ContentDetailsModule,
    MatSnackBarModule ,
    NotificationModule

  ],
  exports: [
    RouterModule,
    ContentHomeModule,
    ContentFormModule,
    ContentDetailsModule,
    NotificationModule
  ],
  providers: [
    ContentService,
    LocationService,
    DayProgramService,
    MediaService,      // Add missing service
    ActivityPointService // Add missing service
  ]
})
export class ContentModule { }
