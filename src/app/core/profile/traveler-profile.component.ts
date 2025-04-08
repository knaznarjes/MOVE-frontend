/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { PreferenceService } from '../services/preference.service';
import { UserService } from '../services/user.service';
import { User, Preference, Account, UserDTO } from '../models/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-traveler-profile',
  templateUrl: './traveler-profile.component.html',
  styleUrls: ['./traveler-profile.component.scss'],
  animations: [
    trigger('photoAnimation', [
      state('default', style({
        transform: 'scale(1)'
      })),
      state('active', style({
        transform: 'scale(1.05)'
      })),
      transition('default <=> active', animate('200ms ease-in-out'))
    ]),
    trigger('formAnimation', [
      state('default', style({
        opacity: 1
      })),
      state('loading', style({
        opacity: 0.7
      })),
      transition('default <=> loading', animate('300ms ease-in-out'))
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TravelerProfileComponent implements OnInit {
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  isLoading = true;
  isUpdating = false;
  currentUser: User | null = null;
  profileImageSrc: string | SafeUrl | null = null;
  selectedFile: File | null = null;
  userPreferences: Preference[] = [];
  uploadProgress: number = 0;
  isPhotoUploading: boolean = false;
  activeCardIndex: number = 0;
  photoState: string = 'default';
  formState: string = 'default';

  @ViewChild('deleteConfirmationDialog') deleteConfirmationDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private accountService: AccountService,
    private preferenceService: PreferenceService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }]
    });

    this.preferencesForm = this.fb.group({
      preferences: this.fb.array([])
    });
  }

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'undefined' || userId === 'null') {
      this.snackBar.open('User not authenticated. Please log in again.', 'Close', { duration: 3000 });
      this.authService.logout();
      return;
    }
    this.loadUserData(userId);
  }

  get preferencesArray(): FormArray {
    return this.preferencesForm.get('preferences') as FormArray;
  }

  createPreferenceFormGroup(): FormGroup {
    return this.fb.group({
      id: [''],
      category: ['', Validators.required],
      priority: ['', Validators.required]
    });
  }

  addPreferenceField(): void {
    this.preferencesArray.push(this.createPreferenceFormGroup());
  }

  removePreferenceField(index: number): void {
    this.preferencesArray.removeAt(index);
  }

  loadUserData(userId: string): void {
    this.isLoading = true;
    this.formState = 'loading';
    console.log('Loading user data for ID:', userId);

    this.userService.getUserById(userId).pipe(
      catchError((userError) => {
        console.error('User not found, trying account service:', userError);
        return this.accountService.getAccountById(userId).pipe(
          catchError((accountError) => {
            console.error('Account not found either:', accountError);
            this.snackBar.open('User profile not found. Please log in again.', 'Close', { duration: 3000 });
            this.authService.logout();
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.isLoading = false;
        this.formState = 'default';
      })
    ).subscribe((userData) => {
      if (userData) {
        if ('fullName' in userData) {
          this.currentUser = userData as User;
          // Corrected access to email through account object
          const email = this.currentUser.account?.email || '';

          this.profileForm.patchValue({
            fullName: this.currentUser.fullName || '',
            email: email
          });

          // Process the profile image URL properly
          this.setProfileImage(this.currentUser.photoProfile);
        } else if ('email' in userData) {
          // This is an Account object
          const account = userData as Account;

          // Create a User object with the account information
          this.currentUser = {
            id: account.id,
            fullName: '', // Account model no longer has fullName
            role: 'TRAVELER', // Setting default role
            account: account,
            preferences: []
          };

          this.profileForm.patchValue({
            fullName: this.currentUser.fullName || '',
            email: account.email
          });
        }

        if (this.currentUser && this.currentUser.id) {
          this.loadPreferences(this.currentUser.id);
        }
      }
    });
  }

  // Helper method to properly set the profile image
  private setProfileImage(url: string | null): void {
    if (!url) {
      this.profileImageSrc = 'assets/images/default-profile.png';
      return;
    }

    // Check if it's a base64 string
    if (url.startsWith('data:image')) {
      // It's already a data URL, use as is
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(url);
    } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/=]+$/)) {
      // It looks like a base64 string without the data:image prefix
      const dataUrl = `data:image/jpeg;base64,${url}`;
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
    } else {
      // Assume it's a regular URL
      this.profileImageSrc = url;
    }
  }

  async uploadProfilePhoto(): Promise<void> {
    if (!this.selectedFile || !this.currentUser?.id) {
      this.snackBar.open('No file selected or user not found', 'Close', { duration: 3000 });
      return;
    }

    this.isPhotoUploading = true;
    this.uploadProgress = 0;

    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(this.selectedFile);

      // Create updated user object with the base64 image
      const updatedUser: User = {
        ...this.currentUser,
        photoProfile: base64Image
      };

      // Update user with base64 image instead of file upload
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertToUserDTO(updatedUser)));

      this.snackBar.open('Profile photo uploaded successfully', 'Close', { duration: 3000 });
      this.selectedFile = null;
      this.uploadProgress = 100;

      // Reload user data to confirm changes
      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      this.snackBar.open('Error uploading photo: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
      this.uploadProgress = 0;
    } finally {
      this.isPhotoUploading = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  loadPreferences(userId: string): void {
    this.preferenceService.getUserPreferences(userId).pipe(
      catchError((error) => {
        console.error('Error loading preferences:', error);
        this.snackBar.open('Error loading preferences: ' + error.message, 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe((preferences) => {
      this.userPreferences = preferences || [];
      this.preferencesArray.clear();

      if (preferences && preferences.length > 0) {
        preferences.forEach(pref => this.preferencesArray.push(this.fb.group({
          id: [pref.id || ''],
          category: [pref.category, Validators.required],
          priority: [pref.priority, Validators.required]
        })));
      } else {
        this.addPreferenceField();
      }
    });
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length) {
      this.selectedFile = element.files[0];
      if (!this.selectedFile.type.startsWith('image/')) {
        this.snackBar.open('Invalid file type. Please upload an image.', 'Close', { duration: 3000 });
        this.selectedFile = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(result);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async updatePreferences(): Promise<void> {
    if (this.preferencesForm.invalid || !this.currentUser?.id) {
      this.snackBar.open('Please fill in all required preference fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';

    try {
      const preferencesToSave: Preference[] = this.preferencesArray.value.map((pref: any) => ({
        id: pref.id || undefined,
        userId: this.currentUser?.id,
        category: pref.category,
        priority: pref.priority
      }));

      await Promise.all(preferencesToSave.map(pref => pref.id
        ? firstValueFrom(this.preferenceService.updatePreference(pref.id, pref))
        : firstValueFrom(this.preferenceService.createPreference(pref))
      ));

      this.snackBar.open('Preferences updated successfully', 'Close', { duration: 3000 });
      this.loadPreferences(this.currentUser.id);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      this.snackBar.open('Error updating preferences: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
      this.formState = 'default';
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid || !this.currentUser?.id) {
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';

    try {
      // Make sure we maintain account structure
      const updatedUser: User = {
        id: this.currentUser.id,
        fullName: this.profileForm.get('fullName')?.value,
        role: this.currentUser.role || 'TRAVELER',
        photoProfile: this.currentUser.photoProfile || null,
        preferences: this.currentUser.preferences || [],
        account: this.currentUser.account || {
          id: this.currentUser.id,
          email: this.profileForm.get('email')?.value
        }
      };

      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertToUserDTO(updatedUser)));
      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });

      // Reload the data to see the changes
      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.snackBar.open('Error updating profile: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
      this.formState = 'default';
    }
  }

  openDeleteConfirmation(): void {
    const dialogRef = this.dialog.open(this.deleteConfirmationDialog);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.deleteAccount();
      }
    });
  }

  async deleteAccount(): Promise<void> {
    if (!this.currentUser?.id) {
      return;
    }

    // Get email from account object
    const email = this.currentUser.account?.email;

    if (!email) {
      this.snackBar.open('Account email not found.', 'Close', { duration: 3000 });
      return;
    }

    try {
      this.isUpdating = true;

      // 1. Delete user preferences
      await firstValueFrom(this.preferenceService.deleteUserPreferences(this.currentUser.id).pipe(
        catchError((error) => {
          console.error('Error deleting preferences:', error);
          this.snackBar.open('Error deleting preferences: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          throw error;
        })
      ));

      // 2. Delete account using email instead of ID
      await firstValueFrom(this.accountService.deleteAccountByEmail(email).pipe(
        catchError((error) => {
          console.error('Error deleting account:', error);
          this.snackBar.open('Error deleting account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          throw error;
        })
      ));

      this.snackBar.open('Account deleted successfully.', 'Close', { duration: 3000 });

      // Logout after deleting the account
      this.authService.logout();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      this.snackBar.open('Error deleting account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
    }
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-profile.png';
  }

  // Added methods for card navigation
  setActiveCard(index: number): void {
    this.activeCardIndex = index;
  }

  navigateCards(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.activeCardIndex > 0) {
      this.activeCardIndex--;
    } else if (direction === 'next' && this.activeCardIndex < 2) {
      this.activeCardIndex++;
    }

}
private convertToUserDTO(user: User): UserDTO {
    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      creationDate: user.creationDate ?? new Date(), // valeur par défaut si undefined
      photoProfile: user.photoProfile ?? '',
      accountDTO: user.account
        ? {
            id: user.account.id ?? '',
            email: user.account.email,
            password: user.account.password
          }
        : undefined,
      preferences: user.preferences?.map(pref => ({
        id: pref.id ?? '',
        userId: pref.userId ?? user.id,
        category: pref.category,
        priority: pref.priority
      })) ?? []
    };
  }
}
