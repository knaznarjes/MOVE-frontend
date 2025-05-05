import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ContentService } from 'app/core/services/content.service';
import { LocationService } from 'app/core/services/location.service';
import { ContentDetailsModule } from './contents/content-details/content-details.module';
import { ContentFormModule } from './contents/content-form/content-form.module';
import { ContentHomeModule } from './contents/content-home/content-home.module';
import { DayProgramService } from '../services/day-program.service';

@NgModule({
  imports: [
    CommonModule,
    ContentHomeModule,
    ContentFormModule,
    ContentDetailsModule
  ],
  exports: [
    RouterModule,
    ContentHomeModule,
    ContentFormModule,
    ContentDetailsModule
  ],
  providers: [
    ContentService,
    LocationService,
    DayProgramService
  ]
})
export class ContentModule { }
