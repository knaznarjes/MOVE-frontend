/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/member-delimiter-style */
/* eslint-disable curly */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable arrow-parens */
/* eslint-disable arrow-body-style */
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { finalize, forkJoin, Observable, of, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivityPoint, Content, ContentType, DayProgram, Media, Location as AppLocation } from 'app/core/models/models';
import { ContentService } from 'app/core/services/content.service';
import { MediaService } from 'app/core/services/media.service';
import { LocationService } from 'app/core/services/location.service';
import { DayProgramService } from 'app/core/services/day-program.service';
import { ActivityPointService } from 'app/core/services/activity-point.service';
import { environment } from 'environments/environment';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as L from 'leaflet';

// Fix Leaflet's default icon paths
import { Icon, Marker } from 'leaflet';
import { SearchService } from 'app/core/services/search.service';
delete (Icon.Default.prototype as any)._getIconUrl;

Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png'
});

// Interface for tag objects
interface Tag {
  value: string;
  label: string;
}

// Interface for Country API response
interface Country {
  name: {
    common: string;
  };
}

@Component({
  selector: 'app-content-form',
  templateUrl: './content-form.component.html',
  styleUrls: ['./content-form.component.scss']
})
export class ContentFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer: ElementRef;
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('videoInput') videoInput: ElementRef;

  contentForm: FormGroup;
  contentId: string | null = null;
  isEditing = false;
  isSubmitting = false;
  loading = false;
  submitError: string | null = null;
  currentStep = 1;
  maxSteps = 4;
  totalSteps = 4;
  contentTypes = Object.values(ContentType);
  content: Content | null = null;
  uploadedCoverImage: File | null = null;
  coverImagePreview: string | null = null;
  uploadedPhotos: File[] = [];
  photosPreviews: string[] = [];
  uploadedVideos: File[] = [];
  videoPreviews: string[] = [];
  existingMedia: Media[] = [];
categories = [
  'Restaurant',
  'Hotel',
  'Attraction',
  'Transport',
  'Activity',
  'Museum',
  'Event',
  'Park',
  'Beach',
  'Market',
  'Nightlife',
  'Hiking Trail',
  'Cultural Experience',
  'Shopping',
  'Historical Site',
  'Viewpoint',
  'Wellness & Spa',
  'Adventure Sports',
  'Camping Site',
  'Boat Tour',
  'Art Gallery',
  'Temple',
  'Zoo & Aquarium',
  'Amusement Park'
];
  difficulties = ['Easy', 'Moderate', 'Difficult'];
  acceptedImageTypes = 'image/jpeg,image/png,image/gif,image/webp';
  acceptedVideoTypes = 'video/mp4,video/webm,video/ogg';

  // Form field validations - messages d'aide pour l'utilisateur
  fieldValidationMessages = {
    title: {
      required: 'Le titre est obligatoire',
      minlength: 'Le titre doit contenir au moins 5 caractères',
      maxlength: 'Le titre ne peut pas dépasser 100 caractères'
    },
    description: {
      required: 'La description est obligatoire',
      minlength: 'La description doit contenir au moins 50 caractères'
    },
    type: {
      required: 'Le type de contenu est obligatoire'
    },
    address: {
      required: 'L\'adresse est obligatoire'
    },
    country: {
      required: 'Le pays est obligatoire'
    },
    dayNumber: {
      required: 'Le numéro de jour est obligatoire'
    },
    dayDescription: {
      required: 'La description du jour est obligatoire'
    },
    activityName: {
      required: 'Le nom de l\'activité est obligatoire'
    },
    activityDescription: {
      required: 'La description de l\'activité est obligatoire'
    },
    cost: {
      required: 'Le coût est obligatoire',
      min: 'Le coût ne peut pas être négatif'
    },
    category: {
      required: 'La catégorie est obligatoire'
    }
  };

  // Map related properties
  map: L.Map;
  markers: L.Marker[] = [];
  mapInitialized = false;
  private mapResizeInterval: any;
  private subscriptions: Subscription[] = [];

  // Location data
  countries: string[] = [];
  filteredCountries: Observable<string[]>;
  countriesLoading = false;

  // Tags properties
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: string[] = [];
  availableTags: Tag[] = [
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

  // Pour le suivi des validations
  formErrors = {
    generalInfo: false,
    datesAndLocation: false,
    dayPrograms: false,
    mediaInfo: false
  };

  // Pour le suivi des champs visités
  touchedFields = {
    title: false,
    description: false
  };

  // Pour vérifier la validation d'étape
  stepValidation = [false, false, false, false];

  // Pour le template compatibility
  get isEditMode(): boolean {
    return this.isEditing;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contentService: ContentService,
    private mediaService: MediaService,
    private locationService: LocationService,
    private dayProgramService: DayProgramService,
    private activityPointService: ActivityPointService,
    private datePipe: DatePipe,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
      private searchService: SearchService, // <-- à ajouter ici

  ) {
    this.contentForm = this.createContentForm();
  }

  ngOnInit(): void {
    this.contentId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.contentId;

    if (this.isEditing && this.contentId) {
      this.loadContent(this.contentId);
    }

    // Initialize countries list using REST Countries API
    this.loadCountriesFromAPI();

    // Initialize tags from form data if editing
    if (this.isEditing) {
      const formTags = this.generalInfo.get('tags')?.value;
      if (formTags && typeof formTags === 'string') {
        this.tags = formTags.split(',').filter(tag => tag.trim() !== '');
      }
    }

    // Ajout de listeners pour afficher les messages d'erreur lorsque l'utilisateur interagit avec les champs
    this.setupFormValidationListeners();

    // Évaluer la validation initiale
    this.evaluateStepValidation();
  }

  /**
   * Configure les écouteurs d'événements pour la validation en temps réel
   */
  setupFormValidationListeners(): void {
    // Écouter les changements du formulaire général
    this.generalInfo.valueChanges.subscribe(() => {
      this.formErrors.generalInfo = this.generalInfo.invalid;
      this.evaluateStepValidation();
    });

    // Écouter spécifiquement les champs critiques
    const titleControl = this.generalInfo.get('title');
    const descriptionControl = this.generalInfo.get('description');

    if (titleControl) {
      titleControl.valueChanges.subscribe(() => {
        this.touchedFields.title = true;
      });
    }

    if (descriptionControl) {
      descriptionControl.valueChanges.subscribe(() => {
        this.touchedFields.description = true;
      });
    }

    // Pour les dates et localisations
    this.datesAndLocation.valueChanges.subscribe(() => {
      this.formErrors.datesAndLocation = this.datesAndLocation.invalid;
      this.evaluateStepValidation();
    });
  }

  /**
   * Évalue si chaque étape est valide
   */
  evaluateStepValidation(): void {
    // Étape 1: Informations générales
    this.stepValidation[0] = this.generalInfo.valid;

    // Étape 2: Dates et localisation
    this.stepValidation[1] = this.datesAndLocation.valid;

    // Étape 3: Programme et activités
    this.stepValidation[2] = true; // Par défaut valide car facultatif
    if (this.dayPrograms.length > 0) {
      for (let i = 0; i < this.dayPrograms.length; i++) {
        if ((this.dayPrograms.at(i) as FormGroup).invalid) {
          this.stepValidation[2] = false;
          break;
        }
      }
    }

    // Étape 4: Médias (toujours valide car facultatif)
    this.stepValidation[3] = true;
console.log('✅ Validation state:', {
  step1: this.generalInfo.valid,
  step2: this.datesAndLocation.valid,
  step3: this.dayPrograms.length > 0 ? this.dayPrograms.valid : 'empty/optional'
});

}

  /**
   * Vérifie si un champ spécifique est invalide et touché
   */
  isFieldInvalid(formGroup: FormGroup, controlName: string): boolean {
    const control = formGroup.get(controlName);
    return control ? control.invalid && (control.dirty || control.touched) : false;
  }

  /**
   * Récupère les messages d'erreur pour un champ spécifique
   */
  getErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (!control || !control.errors) return '';

    const errors = Object.keys(control.errors);
    const fieldErrors = this.fieldValidationMessages[controlName];

    if (errors.length > 0 && fieldErrors) {
      return fieldErrors[errors[0]] || 'Erreur de validation';
    }

    return 'Erreur de validation';
  }

  ngAfterViewInit(): void {
    // We'll initialize the map only when explicitly needed via onStepChange
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Clear any intervals
    if (this.mapResizeInterval) {
      clearInterval(this.mapResizeInterval);
    }

    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());

    // Clean up Leaflet map if it exists
    if (this.map) {
      this.map.remove();
    }
  }

  get currentStepIndex(): number {
    return this.currentStep - 1;
  }

  /**
   * Vérifie si l'étape actuelle est valide
   */
  isCurrentStepValid(): boolean {
    return this.stepValidation[this.currentStepIndex];
  }

  /**
   * Affiche un guide d'aide pour chaque étape
   */
  getStepHelpText(): string {
    switch(this.currentStep) {
      case 1:
        return 'Remplissez les informations générales de votre contenu. Le titre et la description sont obligatoires.';
      case 2:
        return 'Ajoutez les dates et localisations de votre voyage. Cliquez sur la carte pour sélectionner un emplacement.';
      case 3:
        return 'Créez votre programme journalier et ajoutez les activités pour chaque jour.';
      case 4:
        return 'Ajoutez une image de couverture et d\'autres médias pour illustrer votre contenu.';
      default:
        return '';
    }
  }

  /**
   * Affiche les champs requis pour l'étape actuelle
   */
  getRequiredFieldsMessage(): string {
    switch(this.currentStep) {
      case 1:
        return 'Champs requis : Titre (min 5 caractères), Description (min 50 caractères), Type de contenu';
      case 2:
        return 'Champs requis pour chaque localisation : Adresse, Pays';
      case 3:
        if (this.dayPrograms.length > 0) {
          return 'Champs requis pour chaque jour : Numéro de jour, Description. Pour chaque activité : Nom, Description, Coût, Catégorie';
        }
        return 'Aucun jour de programme n\'est obligatoire, mais si vous en ajoutez, tous les champs doivent être remplis.';
      case 4:
        return 'Aucun champ obligatoire dans cette étape.';
      default:
        return '';
    }
  }

  // Handle map click to add marker and update location form
  onMapClick(e: L.LeafletMouseEvent): void {
    const latlng = e.latlng;
    this.reverseGeocode(latlng.lat, latlng.lng).then(address => {
      // Update the currently selected location in the form
      const currentLocationIndex = this.locations.length - 1;
      if (currentLocationIndex >= 0) {
        const locationForm = this.locations.at(currentLocationIndex) as FormGroup;

        locationForm.patchValue({
          address: address.display_name || '',
          country: address.address?.country || '',
          lat: latlng.lat,
          lon: latlng.lng
        });
      }

   // Add marker to map and show a success message
this.addMarker(latlng.lat, latlng.lng, address.display_name);
this.snackBar.open('Location added successfully!', 'Close', {
  duration: 3000,
  panelClass: ['success-snackbar']
});

    });
  }

  // Add marker to map
  addMarker(lat: number, lng: number, title: string): void {
    if (!this.map) {
      console.error('Map not initialized');
      return;
    }

    // Remove existing marker if present
    this.clearMarkers();

    // Add new marker
    const marker = L.marker([lat, lng]).addTo(this.map);
    if (title) {
      marker.bindPopup(title).openPopup();
    }

    this.markers.push(marker);

    // Center map on marker
    this.map.setView([lat, lng], 13);
  }

  // Clear all markers from map
  clearMarkers(): void {
    if (!this.map) return;

    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  // Reverse geocode to get address from coordinates
  async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=fr`);
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error reverse geocoding:', error);
     this.snackBar.open('Error while retrieving the address', 'Close', {
  duration: 5000,
  panelClass: ['error-snackbar']
});

      return { display_name: '', address: { country: '' } };
    }
  }

  // Load list of countries from REST Countries API
  loadCountriesFromAPI(): void {
    this.countriesLoading = true;

    // Use REST Countries API to get all countries
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load countries');
        }
        return response.json();
      })
      .then((data: Country[]) => {
        // Sort countries alphabetically by name
        this.countries = data
          .map(country => country.name.common)
          .sort((a, b) => a.localeCompare(b));

        // Setup country autocomplete
        this.setupCountryAutocomplete();
        this.countriesLoading = false;
      })
      .catch(error => {
        console.error('Error loading countries:', error);
       this.snackBar.open('Error loading the list of countries', 'Close', {
  duration: 5000,
  panelClass: ['error-snackbar']
});


        // Fallback to hardcoded list if API fails
        this.countries = [
          'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
          'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
          'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
          'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
          'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
          'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia',
          'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
          'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini',
          'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
          'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
          'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
          'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
          'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
          'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
          'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia',
          'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
          'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia',
          'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
          'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
          'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
          'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
          'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan',
          'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
          'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
          'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
          'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
          'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
        ];

        this.setupCountryAutocomplete();
        this.countriesLoading = false;
      });
  }

  // Setup country autocomplete
  setupCountryAutocomplete(): void {
    // For each location form control that has a country field
    const locations = this.datesAndLocation.get('locations') as FormArray;

    for (let i = 0; i < locations.length; i++) {
      const locationForm = locations.at(i) as FormGroup;
      const countryControl = locationForm.get('country');

      if (countryControl) {
        // Unsubscribe from previous subscription if exists
        const existingSub = this.subscriptions.find(sub => sub['sourceControl'] === countryControl);
        if (existingSub) {
          existingSub.unsubscribe();
          this.subscriptions = this.subscriptions.filter(sub => sub !== existingSub);
        }

        // Apply the filter logic when the value changes
        const subscription = countryControl.valueChanges.pipe(
          startWith(''),
          map(value => this._filterCountries(value || ''))
        ).subscribe(filteredValues => {
          // Store filtered countries in the observable
          this.filteredCountries = of(filteredValues);
        });

        // Store a reference to the control with the subscription for cleanup
        (subscription as any)['sourceControl'] = countryControl;
        this.subscriptions.push(subscription);
      }
    }
  }

  // Filter country based on input value
  private _filterCountries(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.countries.filter(country => country.toLowerCase().includes(filterValue));
  }

  // Handle tag input
  addTag(event: any): void {
    const input = event.input;
    const value = event.value;

    // Add tag
    if ((value || '').trim()) {
      this.tags.push(value.trim());
      // Update form value
      this.generalInfo.get('tags')?.setValue(this.tags.join(','));
    }

    // Reset input value
    if (input) {
      input.value = '';
    }
  }

  // Remove tag
  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);

    if (index >= 0) {
      this.tags.splice(index, 1);
      // Update form value
      this.generalInfo.get('tags')?.setValue(this.tags.join(','));
    }
  }

  // Select tag from available tags
  selectTag(tag: Tag): void {
    if (!this.tags.includes(tag.value)) {
      this.tags.push(tag.value);
      // Update form value
      this.generalInfo.get('tags')?.setValue(this.tags.join(','));

     // Success notification
this.snackBar.open(`Tag "${tag.value}" added!`, 'Close', {
  duration: 2000
});

    }
  }

  // Form creation methods...
  createContentForm(): FormGroup {
    return this.fb.group({
      // Card 1: Informations générales
      generalInfo: this.fb.group({
        title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.minLength(50)]],
        type: [ContentType.TRAVEL_STORY, Validators.required],
        tags: [''],
        budget: [null]
      }),

      // Card 2: Dates et localisation
      datesAndLocation: this.fb.group({
        startDate: [null],
        endDate: [null],
        locations: this.fb.array([this.createLocationForm()])
      }, { validators: this.dateRangeValidator }),

      // Card 3: Programme et activités
      dayPrograms: this.fb.array([]),

      // Card 4: Médias
      mediaInfo: this.fb.group({
        coverTitle: [''],
        coverDescription: ['']
      })
    });
  }

  // Validateur personnalisé pour vérifier que la date de fin est après la date de début
  dateRangeValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { dateRange: true };
    }

    return null;
  }

  createLocationForm(): FormGroup {
    return this.fb.group({
      id: [null],
      address: [''],
      country: [''],
      lat: [null],
      lon: [null]
    });
  }

  createDayProgramForm(): FormGroup {
    return this.fb.group({
      id: [null],
      dayNumber: [this.dayPrograms.length + 1, Validators.required],
      description: ['', Validators.required],
      activities: this.fb.array([])
    });
  }

  createActivityForm(): FormGroup {
    return this.fb.group({
      id: [null],
      name: ['', Validators.required],
      description: ['', Validators.required],
      cost: [0, [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      difficulty: ['Facile'],
      contactInfo: [''],
      location: this.createLocationForm()
    });
  }

  // Getters
  get generalInfo(): FormGroup {
    return this.contentForm.get('generalInfo') as FormGroup;
  }

  get datesAndLocation(): FormGroup {
    return this.contentForm.get('datesAndLocation') as FormGroup;
  }

  get locations(): FormArray {
    return this.datesAndLocation.get('locations') as FormArray;
  }

  get dayPrograms(): FormArray {
    return this.contentForm.get('dayPrograms') as FormArray;
  }

  get mediaInfo(): FormGroup {
    return this.contentForm.get('mediaInfo') as FormGroup;
  }

  // Méthodes pour ajouter des éléments aux FormArrays
  addLocation(): void {
    this.locations.push(this.createLocationForm());
    // Update autocomplete for the new location
    setTimeout(() => this.setupCountryAutocomplete(), 0);

   // Confirmation message
this.snackBar.open('New location added', 'OK', {
  duration: 2000
});

  }
getMediaUrl(mediaId: string): string {
  return `${environment.apiUrl}/api/media/file/${mediaId}`;
}

  removeLocation(index: number): void {
    if (this.locations.length > 1) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette localisation?')) {
        this.locations.removeAt(index);

       // Confirmation message
this.snackBar.open('Location removed', 'OK', {
  duration: 2000
});

      }
    } else {
     this.snackBar.open('You must have at least one location', 'OK', {
  duration: 3000,
  panelClass: ['warning-snackbar']
});

    }
  }

  addDayProgram(): void {
    this.dayPrograms.push(this.createDayProgramForm());

    // Réévaluer la validation
    this.evaluateStepValidation();
  }

  removeDayProgram(index: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce jour de programme?')) {
      this.dayPrograms.removeAt(index);
      // Renumber remaining day programs
      for (let i = 0; i < this.dayPrograms.length; i++) {
        (this.dayPrograms.at(i) as FormGroup).get('dayNumber')?.setValue(i + 1);
      }


      // Réévaluer la validation
      this.evaluateStepValidation();
    }
  }

  getActivities(dayIndex: number): FormArray {
    return (this.dayPrograms.at(dayIndex) as FormGroup).get('activities') as FormArray;
  }

  addActivity(dayIndex: number): void {
    this.getActivities(dayIndex).push(this.createActivityForm());
  }

  removeActivity(dayIndex: number, activityIndex: number): void {
    this.getActivities(dayIndex).removeAt(activityIndex);
  }

  // Navigation entre les étapes
  previousStep(): void {
    if (this.currentStep > 1) {
      this.onStepChange(this.currentStep - 1);
    }
  }
  onStepChange(step: number): void {
  const previousStep = this.currentStep;
  this.currentStep = step;

  if (step === 2) {
    setTimeout(() => {
      const container = this.mapContainer?.nativeElement;
      if (!container) return;

   if (!this.mapInitialized) {
  this.initializeMap();
} else {
  requestAnimationFrame(() => {
    this.map.invalidateSize();
  });
}

    }, 0); // le DOM est souvent prêt sans attendre 300ms
  }
}

initializeMap(): void {
  const container = this.mapContainer?.nativeElement;
  if (!container || this.mapInitialized) return;

  this.map = L.map(container, {
    center: [46.2276, 2.2137],
    zoom: 6
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(this.map);

  this.map.on('click', (e: L.LeafletMouseEvent) => this.onMapClick(e));
  this.mapInitialized = true;

  // Correction de taille juste après le DOM ready
  requestAnimationFrame(() => {
    this.map.invalidateSize();
  });

  // Sécurité : resize périodique
  this.mapResizeInterval = setInterval(() => {
    if (this.map && document.contains(container)) {
      this.map.invalidateSize();
    } else {
      clearInterval(this.mapResizeInterval);
    }
  }, 1000);
}


  // Gestion des médias
  onCoverImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadedCoverImage = file;

      // Prévisualisation
      const reader = new FileReader();
      reader.onload = () => {
        this.coverImagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onPhotosSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedPhotos.push(files[i]);

        // Prévisualisation
        const reader = new FileReader();
        reader.onload = (e) => {
          this.photosPreviews.push(e.target?.result as string);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }

  onVideosSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length) {
      for (let i = 0; i < files.length; i++) {
        this.uploadedVideos.push(files[i]);

        // Generate a preview for video (thumbnail or video element)
        const reader = new FileReader();
        reader.onload = (e) => {
          this.videoPreviews.push(e.target?.result as string);
        };
        reader.readAsDataURL(files[i]);
      }
    }
  }
  removePhoto(index: number): void {
    this.uploadedPhotos.splice(index, 1);
    this.photosPreviews.splice(index, 1);
  }

  removeVideo(index: number): void {
    this.uploadedVideos.splice(index, 1);
    this.videoPreviews.splice(index, 1);
  }

  removeExistingMedia(mediaId: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
      this.mediaService.deleteMedia(mediaId).subscribe(() => {
        this.existingMedia = this.existingMedia.filter(media => media.id !== mediaId);
      });
    }
  }

  // Check if a media file is a video
  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  // Get the file type (image or video)
  getFileType(file: File): string {
    return file.type.startsWith('video/') ? 'video' : 'image';
  }

  // Chargement des données pour l'édition
  loadContent(id: string): void {
    this.contentService.getContentById(id).subscribe(content => {
      this.content = content;
      this.patchContentForm(content);

      // Chargement des médias associés
      this.mediaService.getMediaByContentId(id).subscribe(media => {
        this.existingMedia = media;

        // Récupérer l'image de couverture pour prévisualisation
        const coverImage = media.find(m => m.mediaType === 'COVER');
        if (coverImage) {
          // Construire l'URL pour la prévisualisation (dépend de votre backend)
          this.coverImagePreview = `${environment.apiUrl}/api/media/file/${coverImage.id}`;
        }
      });

      // Load tags
      if (content.tags) {
        if (typeof content.tags === 'string') {
          this.tags = content.tags.split(',').filter(tag => tag.trim() !== '');
        } else if (Array.isArray(content.tags)) {
          this.tags = content.tags;
        }
      }
    });
  }

  patchContentForm(content: Content): void {
    // Patch general info
    this.generalInfo.patchValue({
      title: content.title,
      description: content.description,
      type: content.type,
      tags: content.tags,
      budget: content.budget
    });

    // Patch dates and location
    this.datesAndLocation.patchValue({
      startDate: content.startDate ? new Date(content.startDate) : null,
      endDate: content.endDate ? new Date(content.endDate) : null
    });

    // Clear and patch locations
    while (this.locations.length) {
      this.locations.removeAt(0);
    }

    if (content.locations && content.locations.length) {
      content.locations.forEach(location => {
        this.locations.push(this.fb.group({
          id: location.id,
          address: location.address,
          country: location.country,
          lat: location.lat,
          lon: location.lon
        }));
      });
    } else {
      this.addLocation();
    }

    // Clear and patch day programs
    while (this.dayPrograms.length) {
      this.dayPrograms.removeAt(0);
    }

    if (content.dayPrograms && content.dayPrograms.length) {
      content.dayPrograms.sort((a, b) => a.dayNumber - b.dayNumber).forEach(day => {
        const dayForm = this.fb.group({
          id: day.id,
          dayNumber: day.dayNumber,
          description: day.description,
          activities: this.fb.array([])
        });

        const activitiesFormArray = dayForm.get('activities') as FormArray;

        if (day.activities && day.activities.length) {
          day.activities.forEach(activity => {
            activitiesFormArray.push(this.fb.group({
              id: activity.id,
              name: activity.name,
              description: activity.description,
              cost: activity.cost,
              category: activity.category,
              difficulty: activity.difficulty,
              contactInfo: activity.contactInfo,
              location: this.fb.group({
                id: activity.location?.id,
                address: activity.location?.address || '',
                country: activity.location?.country || '',
                lat: activity.location?.lat,
                lon: activity.location?.lon
              })
            }));
          });
        }

        this.dayPrograms.push(dayForm);
      });
    }
  }

onSubmit(): void {
  console.log('🟢 Submit called');

  this.markFormGroupTouched(this.contentForm);

  const generalInfoValid = this.generalInfo.valid;
  const datesAndLocationValid = this.datesAndLocation.valid;
  let dayProgramsValid = true;

  if (this.dayPrograms.length > 0) {
    for (let i = 0; i < this.dayPrograms.length; i++) {
      if ((this.dayPrograms.at(i) as FormGroup).invalid) {
        dayProgramsValid = false;
        break;
      }
    }
  }

  if (!generalInfoValid || !datesAndLocationValid || !dayProgramsValid) {
    this.submitError = 'Please fill all required fields correctly';
    return;
  }

  this.isSubmitting = true;
  this.loading = true;
  this.submitError = null;

  const formValue = this.contentForm.value;
  const contentData: Content = {
    title: formValue.generalInfo.title,
    description: formValue.generalInfo.description,
    type: formValue.generalInfo.type,
    tags: formValue.generalInfo.tags,
    budget: formValue.generalInfo.budget,
    startDate: formValue.datesAndLocation.startDate ? new Date(formValue.datesAndLocation.startDate) : undefined,
    endDate: formValue.datesAndLocation.endDate ? new Date(formValue.datesAndLocation.endDate) : undefined,
    creationDate: new Date(),
    media: [],
    locations: [],
    dayPrograms: this.dayPrograms.value,
    isPublished: false,
    averageRating: 0
  };

  if (this.isEditing && this.content) {
    contentData.id = this.content.id;
  }

  const saveContentToBackend = () => {
    const request = this.isEditing && this.content?.id
      ? this.contentService.updateContent(this.content.id, contentData)
      : this.contentService.createContent(contentData);

    request.subscribe({
      next: (savedContent) => {
        this.saveMedia(savedContent.id!).then(() => {
          this.saveDayPrograms(savedContent.id!).then(() => {
            this.snackBar.open('🎉 Contenu sauvegardé et synchronisé via RabbitMQ !', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });

            this.isSubmitting = false;
            this.loading = false;
            this.router.navigate(['/content', savedContent.id]);
          });
        });
      },
      error: (err) => {
        console.error('❌ Erreur lors de la sauvegarde du contenu', err);
        this.snackBar.open('❌ Erreur pendant la sauvegarde du contenu', 'Fermer', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
        this.loading = false;
        this.submitError = 'An error occurred while saving your content. Please try again.';
      }
    });
  };

  this.saveLocations().then(locations => {
    contentData.locations = locations;
    saveContentToBackend();
  });
}

markFormGroupTouched(group: AbstractControl): void {
  if (group instanceof FormGroup) {
    Object.keys(group.controls).forEach(key => {
      const control = group.get(key);
      this.markFormGroupTouched(control!);
    });
  } else if (group instanceof FormArray) {
    group.controls.forEach(control => {
      this.markFormGroupTouched(control);
    });
  } else {
    group.markAsTouched();
  }
}

  // Sauvegarder les localisations
  async saveLocations(): Promise<AppLocation[]> {
    const locations: AppLocation[] = [];
    const locationForms = this.locations.value;

    for (const locationForm of locationForms) {
      if (locationForm.id) {
        // Mettre à jour la localisation existante
        const updatedLocation = await this.locationService.updateLocation(
          locationForm.id,
          locationForm
        ).toPromise();
        if (updatedLocation) {
          locations.push(updatedLocation);
        }
      } else {
        // Créer une nouvelle localisation
        const newLocation = await this.locationService.createLocation(
          locationForm
        ).toPromise();
        if (newLocation) {
          locations.push(newLocation);
        }
      }
    }

    return locations;
  }

  // Sauvegarder les médias
  async saveMedia(contentId: string): Promise<void> {
    // Upload de l'image de couverture si présente
    if (this.uploadedCoverImage) {
      await this.mediaService.uploadCoverImage(
        this.uploadedCoverImage,
        contentId,
        this.mediaInfo.value.coverTitle || this.generalInfo.value.title,
        this.mediaInfo.value.coverDescription || ''
      ).toPromise();
    }

    // Upload des photos
    for (let i = 0; i < this.uploadedPhotos.length; i++) {
      await this.mediaService.uploadAlbumPhoto(
        this.uploadedPhotos[i],
        contentId,
        `Photo ${i + 1}`,
        '',
        i + 1
      ).toPromise();
    }

    // Upload des vidéos
    for (let i = 0; i < this.uploadedVideos.length; i++) {
      await this.mediaService.uploadVideo(
        this.uploadedVideos[i],
        contentId,
        `Video ${i + 1}`,
        '',
        this.uploadedPhotos.length + i + 1  // Display order starts after photos
      ).toPromise();
    }

}
async saveDayPrograms(contentId: string): Promise<void> {
    const dayProgramForms = this.dayPrograms.value;

    if (!dayProgramForms || dayProgramForms.length === 0) {
      console.log('❌ Aucun jour de programme à sauvegarder');
      return;
    }

    for (const dayForm of dayProgramForms) {
      const dayProgramData: DayProgram = {
        dayNumber: dayForm.dayNumber,
        description: dayForm.description,
        contentId: contentId,
        activities: []
      };

      const startDate = this.contentForm.get('datesAndLocation.startDate')?.value;
      const activities = dayForm.activities || [];

      try {
        // Créer ou mettre à jour le jour de programme
        let dayId: string | undefined;
        if (dayForm.id) {
          const updatedDay = await this.dayProgramService.update(dayForm.id, dayProgramData).toPromise();
          dayId = updatedDay?.id;
        } else {
          const newDay = await this.dayProgramService.create(dayProgramData).toPromise();
          dayId = newDay?.id;
        }

        if (!dayId) {
          console.error('⚠️ Impossible de créer ou mettre à jour le jour de programme');
          continue;
        }

        // 🔁 Traitement des activités
        for (const activityForm of activities) {
          let activityLocation: AppLocation | undefined;

          if (activityForm.location) {
            if (activityForm.location.id) {
              activityLocation = await this.locationService.updateLocation(
                activityForm.location.id,
                activityForm.location
              ).toPromise() as AppLocation;
            } else {
              activityLocation = await this.locationService.createLocation(
                activityForm.location
              ).toPromise() as AppLocation;
            }
          }
          const activityData: ActivityPoint = {
            name: activityForm.name,
            description: activityForm.description,
            cost: activityForm.cost || 0,
            category: activityForm.category || 'Misc',
            difficulty: activityForm.difficulty || 'Facile',
            contactInfo: activityForm.contactInfo || '',
            dayProgramId: dayId,
            location: activityLocation
          };

          // ✅ Log complet pour vérification
          console.log('🟢 Activity à envoyer :', activityData);

          if (activityForm.id) {
            await this.activityPointService.update(activityForm.id, activityData).toPromise();
          } else {
            await this.activityPointService.create(activityData).toPromise();
          }
        }
      } catch (error) {
        console.error(`❌ Erreur pour le jour ${dayForm.dayNumber}:`, error);
      }
    }
  }
// Add this method to your ContentFormComponent class
nextStep(): void {
  // ✅ Recalcule les validations à jour pour éviter faux positifs
  this.evaluateStepValidation();

  console.log('🔁 Step:', this.currentStep, 'valid?', this.isCurrentStepValid());

  if (this.currentStep < this.maxSteps) {
    let isCurrentStepValid = true;

    if (this.currentStep === 1 && this.generalInfo.invalid) {
      this.markFormGroupTouched(this.generalInfo);
      isCurrentStepValid = false;
    } else if (this.currentStep === 2 && this.datesAndLocation.invalid) {
      this.markFormGroupTouched(this.datesAndLocation);
      isCurrentStepValid = false;
    } else if (this.currentStep === 3 && this.dayPrograms.length > 0) {
      for (let i = 0; i < this.dayPrograms.length; i++) {
        if ((this.dayPrograms.at(i) as FormGroup).invalid) {
          this.markFormGroupTouched(this.dayPrograms.at(i));
          isCurrentStepValid = false;
          break;
        }
      }
    }

    // ✅ Corrigé : Ne pas afficher de message pour l'étape 4
    if (isCurrentStepValid) {
      this.onStepChange(this.currentStep + 1);
    } else {
      if (this.currentStep < 4) {
        this.submitError = 'Please complete all required fields before proceeding.';
        setTimeout(() => {
          this.submitError = null;
        }, 3000);
      }
    }
  }
}

}
