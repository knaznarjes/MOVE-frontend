/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-parens */
/* eslint-disable curly */
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';

import { HttpEventType } from '@angular/common/http';
import { ActivityPoint, Content, ContentType, DayProgram, Media, Location } from 'app/core/models/models';
import { ContentService } from 'app/core/services/content.service';
import { LocationService } from 'app/core/services/location.service';
import { MediaService } from 'app/core/services/media.service';
import { DayProgramService } from 'app/core/services/day-program.service';
import { ActivityPointService } from 'app/core/services/activity-point.service';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-content-form',
  templateUrl: './content-form.component.html',
  styleUrls: ['./content-form.component.scss']
})
export class ContentFormComponent implements OnInit {
selectedTags: any;
addTag($event: any) {
throw new Error('Method not implemented.');
}
  contentForm: FormGroup;
  contentTypes = Object.values(ContentType);
  isEditing = false;
  contentId: string;
  isLoading = false;
  uploadProgress = 0;
  existingLocations: Location[] = [];
  uploadedMedia: Media[] = [];
  isSubmitting = false;
  submitError = '';
  formErrors: { [key: string]: string } = {};
  coverImagePreview: string;
  countries: Location[] = [];
  private coverImageFile: File;

  constructor(
    private fb: FormBuilder,
    private contentService: ContentService,
    private locationService: LocationService,
    private mediaService: MediaService,
    private dayProgramService: DayProgramService,
    private activityPointService: ActivityPointService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.fetchLocations();
    this.fetchCountries();
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.contentId = params['id'];
        this.isEditing = true;
        this.loadContentData();
      }
    });
  }
  availableTags = [
    { value: 'Beach', label: 'Beach' },
    { value: 'Mountain', label: 'Mountain' },
    { value: 'Adventure', label: 'Adventure' },
    { value: 'Cultural', label: 'Cultural' },
    { value: 'Hiking', label: 'Hiking' },
    { value: 'City Tour', label: 'City Tour' },
    { value: 'Nature', label: 'Nature' },
    { value: 'Wildlife', label: 'Wildlife' },
    { value: 'Road Trip', label: 'Road Trip' },
    { value: 'Historical', label: 'Historical' },
    { value: 'Luxury', label: 'Luxury' },
    { value: 'Budget', label: 'Budget' },
    { value: 'Photography', label: 'Photography' },
    { value: 'Camping', label: 'Camping' },
    { value: 'Snorkeling', label: 'Snorkeling' },
    { value: 'Diving', label: 'Diving' },
    { value: 'Skiing', label: 'Skiing' },
    { value: 'Foodie', label: 'Foodie' },
    { value: 'Family', label: 'Family' },
    { value: 'Romantic', label: 'Romantic' }
  ];
  createForm(): void {
    this.contentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      type: [ContentType.TRAVEL_STORY, Validators.required],
      startDate: [''],
      endDate: [''],
      budget: [0],
      tags: [''],
      locations: this.fb.array([]),
      dayPrograms: this.fb.array([])
    });

    // Add validators for dates when type is Itinerary
    this.contentForm.get('type').valueChanges.subscribe(type => {
      const startDateControl = this.contentForm.get('startDate');
      const endDateControl = this.contentForm.get('endDate');

      if (type === ContentType.ITINERARY) {
        startDateControl.setValidators([Validators.required]);
        endDateControl.setValidators([Validators.required]);
      } else {
        startDateControl.clearValidators();
        endDateControl.clearValidators();
      }

      startDateControl.updateValueAndValidity();
      endDateControl.updateValueAndValidity();
    });
  }

  fetchLocations(): void {
    this.locationService.getAllLocations().subscribe(
      locations => {
        this.existingLocations = locations;
      },
      error => {
        console.error('Error fetching locations:', error);
      }
    );
  }

  fetchCountries(): void {
    this.locationService.getAllCountries().subscribe(
      data => {
        this.countries = data
          .filter(c => c.name && c.latlng && c.latlng.length >= 2)
          .map(c => ({
            id: '',
            address: '',
            country: c.name.common,
            lat: c.latlng[0],
            lon: c.latlng[1]
          } as Location))
          .sort((a, b) => a.country.localeCompare(b.country));
      },
      error => {
        console.error('Error fetching countries:', error);
      }
    );
  }

  get locationsArray(): FormArray {
    return this.contentForm.get('locations') as FormArray;
  }

  get dayProgramsArray(): FormArray {
    return this.contentForm.get('dayPrograms') as FormArray;
  }

  addLocation(): void {
    const locationGroup = this.fb.group({
      id: [''],
      address: ['', Validators.required],
      country: ['', Validators.required],
      lat: [null],
      lon: [null]
    });

    this.locationsArray.push(locationGroup);
  }

  removeLocation(index: number): void {
    this.locationsArray.removeAt(index);
  }

  addDayProgram(): void {
    const dayNumber = this.dayProgramsArray.length + 1;

    const dayProgramGroup = this.fb.group({
      id: [''],
      dayNumber: [dayNumber],
      description: ['', Validators.required],
      activities: this.fb.array([])
    });

    this.dayProgramsArray.push(dayProgramGroup);
  }

  removeDayProgram(index: number): void {
    this.dayProgramsArray.removeAt(index);

    // Update day numbers for remaining days
    const dayPrograms = this.dayProgramsArray.controls;
    for (let i = 0; i < dayPrograms.length; i++) {
      dayPrograms[i].get('dayNumber').setValue(i + 1);
    }
  }

  getActivitiesArray(dayIndex: number): FormArray {
    return (this.dayProgramsArray.at(dayIndex) as FormGroup).get('activities') as FormArray;
  }

  addActivity(dayIndex: number): void {
    const activityGroup = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      description: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      cost: [0],
      category: [''],
      difficulty: ['EASY'],
      contactInfo: [''],
      location: this.fb.group({
        id: [''],
        address: ['', Validators.required],
        country: ['', Validators.required],
        lat: [null],
        lon: [null]
      })
    });

    this.getActivitiesArray(dayIndex).push(activityGroup);
  }

  removeActivity(dayIndex: number, activityIndex: number): void {
    this.getActivitiesArray(dayIndex).removeAt(activityIndex);
  }

  uploadCoverImage(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Display preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);

      if (this.contentId) {
        this.uploadMedia(file, true);
      } else {
        // Store file to upload after content creation
        this.coverImageFile = file;
      }
    }
  }

  uploadMedia(file: File, isCover: boolean = false): void {
    if (!this.contentId) {
      console.error('Cannot upload media without content ID');
      return;
    }

    this.uploadProgress = 0;
    this.isLoading = true;

    const title = isCover ? 'Cover Image' : file.name;
    const description = isCover ? 'Cover image for content' : 'Media for content';
    const mediaType = isCover ? 'COVER' : 'ALBUM';

    this.mediaService.uploadMedia(file, this.contentId, title, description, mediaType)
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe(
        event => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(100 * event.loaded / event.total);
          } else if (event.type === HttpEventType.Response) {
            const media = event.body;
            this.uploadedMedia.push(media);

            if (isCover) {
              // Update content with new cover image
              this.contentService.updateContent(this.contentId, {
                id: this.contentId,
                coverImageId: media.id
              } as Content).subscribe();
            }
          }
        },
        error => {
          console.error('Error uploading media:', error);
        }
      );
  }

  loadContentData(): void {
    this.isLoading = true;

    this.contentService.getContentById(this.contentId)
      .pipe(
        tap(content => {
          // Populate form with content data
          this.contentForm.patchValue({
            title: content.title,
            description: content.description,
            type: content.type,
            startDate: content.startDate ? new Date(content.startDate).toISOString().split('T')[0] : '',
            endDate: content.endDate ? new Date(content.endDate).toISOString().split('T')[0] : '',
            budget: content.budget,
            tags: content.tags
          });

          // Load locations
          if (content.locations && content.locations.length > 0) {
            content.locations.forEach(location => {
              const locationGroup = this.fb.group({
                id: [location.id],
                address: [location.address, Validators.required],
                country: [location.country, Validators.required],
                lat: [location.lat],
                lon: [location.lon]
              });
              this.locationsArray.push(locationGroup);
            });
          }

          // Load day programs
          if (content.dayPrograms && content.dayPrograms.length > 0) {
            content.dayPrograms.sort((a, b) => a.dayNumber - b.dayNumber);

            content.dayPrograms.forEach(day => {
              const dayGroup = this.fb.group({
                id: [day.id],
                dayNumber: [day.dayNumber],
                description: [day.description, Validators.required],
                activities: this.fb.array([])
              });

              const activitiesArray = dayGroup.get('activities') as FormArray;

              // Load activities for this day
              if (day.activities && day.activities.length > 0) {
                day.activities.forEach(activity => {
                  const activityGroup = this.fb.group({
                    id: [activity.id],
                    name: [activity.name, Validators.required],
                    description: [activity.description, Validators.required],
                    startTime: [activity.startTime ? new Date(activity.startTime).toISOString().slice(0, 16) : ''],
                    endTime: [activity.endTime ? new Date(activity.endTime).toISOString().slice(0, 16) : ''],
                    cost: [activity.cost],
                    category: [activity.category],
                    difficulty: [activity.difficulty],
                    contactInfo: [activity.contactInfo],
                    location: this.fb.group({
                      id: [activity.location?.id || ''],
                      address: [activity.location?.address || '', Validators.required],
                      country: [activity.location?.country || '', Validators.required],
                      lat: [activity.location?.lat],
                      lon: [activity.location?.lon]
                    })
                  });

                  activitiesArray.push(activityGroup);
                });
              }

              this.dayProgramsArray.push(dayGroup);
            });
          }

          // Load media
          this.uploadedMedia = content.media || [];

          // Set cover image if available
          const coverImage = content.media?.find(m => m.mediaType === 'COVER');
          if (coverImage) {
            // Assuming you have a URL to display the image
            this.coverImagePreview = `${environment.apiUrl}/api/media/file/${coverImage.id}`;
          }
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        () => {},
        error => {
          console.error('Error loading content:', error);
        }
      );
  }

  onSubmit(): void {
    if (this.contentForm.invalid) {
      this.validateAllFormFields();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    const formValue = this.contentForm.value;

    const content: Content = {
      id: this.isEditing ? this.contentId : undefined,
      title: formValue.title,
      description: formValue.description,
      type: formValue.type,
      startDate: formValue.startDate ? new Date(formValue.startDate) : undefined,
      endDate: formValue.endDate ? new Date(formValue.endDate) : undefined,
      budget: formValue.budget,
      tags: formValue.tags,
      media: [],
      locations: [],
      dayPrograms: []
    };

    const saveOperation = this.isEditing ?
      this.contentService.updateContent(this.contentId, content) :
      this.contentService.createContent(content);

    saveOperation.pipe(
      switchMap(savedContent => {
        this.contentId = savedContent.id;

        // If we have a new cover image waiting to be uploaded
        if (this.coverImageFile) {
          this.uploadMedia(this.coverImageFile, true);
          this.coverImageFile = null;
        }

        // Create or update locations
        const locationOperations = formValue.locations.map(location => {
          if (location.id) {
            return this.locationService.updateLocation(location.id, location);
          } else {
            return this.locationService.createLocation({
              ...location,
              contentId: this.contentId
            });
          }
        });

        return locationOperations.length ? forkJoin(locationOperations) : of([]);
      }),
      switchMap(() => {
        // Create or update day programs and their activities
        const dayProgramOperations = formValue.dayPrograms.map(day => {
          const dayProgram: DayProgram = {
            id: day.id,
            dayNumber: day.dayNumber,
            description: day.description,
            contentId: this.contentId,
            activities: []
          };

          const saveDay = day.id ?
            this.dayProgramService.update(day.id, dayProgram) :
            this.dayProgramService.create(dayProgram);

          return saveDay.pipe(
            switchMap(savedDay => {
              // Create or update activities for this day
              const activityOperations = day.activities.map(activity => {
                const activityPoint: ActivityPoint = {
                  id: activity.id,
                  name: activity.name,
                  description: activity.description,
                  startTime: new Date(activity.startTime),
                  endTime: new Date(activity.endTime),
                  cost: activity.cost,
                  category: activity.category,
                  difficulty: activity.difficulty,
                  contactInfo: activity.contactInfo,
                  itineraryDayId: savedDay.id,
                  location: activity.location
                };

                if (activity.id) {
                  return this.activityPointService.update(activity.id, activityPoint);
                } else {
                  return this.activityPointService.create(activityPoint);
                }
              });

              return activityOperations.length ? forkJoin(activityOperations) : of([]);
            })
          );
        });

        return dayProgramOperations.length ? forkJoin(dayProgramOperations) : of([]);
      }),
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe(
      () => {
        // Navigate to content details page
        this.router.navigate(['/content', this.contentId]);
      },
      error => {
        console.error('Error saving content:', error);
        this.submitError = 'Error saving content. Please try again.';
      }
    );
  }

  validateAllFormFields(): void {
    this.formErrors = {};

    const form = this.contentForm;
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup) {
        this.validateFormGroup(control);
      } else {
        control.markAsTouched();
        if (control.errors) {
          this.formErrors[key] = this.getErrorMessage(control.errors);
        }
      }
    });

    // Validate locations
    this.locationsArray.controls.forEach((control, index) => {
      this.validateFormGroup(control as FormGroup, `locations[${index}]`);
    });

    // Validate day programs and activities
    this.dayProgramsArray.controls.forEach((dayControl, dayIndex) => {
      this.validateFormGroup(dayControl as FormGroup, `dayPrograms[${dayIndex}]`);

      const activitiesArray = this.getActivitiesArray(dayIndex);
      activitiesArray.controls.forEach((activityControl, activityIndex) => {
        this.validateFormGroup(activityControl as FormGroup, `dayPrograms[${dayIndex}].activities[${activityIndex}]`);

        // Validate activity location
        const locationControl = (activityControl as FormGroup).get('location') as FormGroup;
        this.validateFormGroup(locationControl, `dayPrograms[${dayIndex}].activities[${activityIndex}].location`);
      });
    });
  }

  validateFormGroup(group: FormGroup, prefix: string = ''): void {
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      const fieldName = prefix ? `${prefix}.${key}` : key;

      if (control instanceof FormGroup) {
        this.validateFormGroup(control, fieldName);
      } else {
        control.markAsTouched();
        if (control.errors) {
          this.formErrors[fieldName] = this.getErrorMessage(control.errors);
        }
      }
    });
  }

  getErrorMessage(errors: any): string {
    if (errors.required) {
      return 'This field is required';
    } else if (errors.minlength) {
      return `Minimum length is ${errors.minlength.requiredLength} characters`;
    } else if (errors.maxlength) {
      return `Maximum length is ${errors.maxlength.requiredLength} characters`;
    }
    return 'Invalid value';
  }

  getFormControlError(controlName: string): string {
    return this.formErrors[controlName] || '';
  }

  isControlValid(controlName: string): boolean {
    const control = this.contentForm.get(controlName);
    return control ? control.valid || !control.touched : true;
  }

  isActivityControlValid(dayIndex: number, activityIndex: number, controlName: string): boolean {
    const control = this.getActivitiesArray(dayIndex).at(activityIndex).get(controlName);
    return control ? control.valid || !control.touched : true;
  }

  isLocationControlValid(dayIndex: number, activityIndex: number, controlName: string): boolean {
    const control = ((this.getActivitiesArray(dayIndex).at(activityIndex) as FormGroup).get('location') as FormGroup).get(controlName);
    return control ? control.valid || !control.touched : true;
  }

  selectExistingLocation(locationGroup: FormGroup): void {
    const locationId = locationGroup.get('id').value;
    if (locationId) {
      const location = this.existingLocations.find(loc => loc.id === locationId);
      if (location) {
        locationGroup.patchValue({
          address: location.address,
          country: location.country,
          lat: location.lat,
          lon: location.lon
        });
      }
    }
  }

  onCountrySelected(locationGroup: FormGroup, countryName: string): void {
    const selectedCountry = this.countries.find(c => c.country === countryName);
    if (selectedCountry) {
      locationGroup.patchValue({
        lat: selectedCountry.lat,
        lon: selectedCountry.lon
      });
    }
  }

  publishContent(): void {
    if (!this.contentId) return;

    this.isLoading = true;
    this.contentService.publishContent(this.contentId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(
        () => {
          // Navigate to content details page
          this.router.navigate(['/content', this.contentId]);
        },
        error => {
          console.error('Error publishing content:', error);
          this.submitError = 'Error publishing content. Please try again.';
        }
      );
  }

  unpublishContent(): void {
    if (!this.contentId) return;

    this.isLoading = true;
    this.contentService.unpublishContent(this.contentId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(
        () => {
          // Navigate to content details page
          this.router.navigate(['/content', this.contentId]);
        },
        error => {
          console.error('Error unpublishing content:', error);
          this.submitError = 'Error unpublishing content. Please try again.';
        }
      );
  }
}
