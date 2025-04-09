/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
// Here are the fixed methods for the TravelerProfileComponent

import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { PreferenceService } from '../../services/preference.service';
import { UserService } from '../../services/user.service';
import { User, Preference, Account, UserDTO } from '../../models/models';
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
  passwordForm: FormGroup;
  isLoading = true;
  isUpdating = false;
  currentUser: User | null = null;
  profileImageSrc: string | SafeUrl | null = null;
  selectedFile: File | null = null;
  userPreferences: Preference[] = [];
  uploadProgress: number = 0;
  isPhotoUploading: boolean = false;
  activeTab: string = 'profile';
  formState: string = 'default';
  activeCardIndex: number = 0;
  photoState: string = 'default';

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

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
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

  loadUserData(userId: string): void {
    this.isLoading = true;
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
      })
    ).subscribe((userData) => {
      if (userData) {
        this.currentUser = userData as User;
        this.profileForm.patchValue({
          fullName: this.currentUser.fullName || '',
          email: this.currentUser?.email
        });

        // Process the profile image URL properly
        this.setProfileImage(this.currentUser.photoProfile);
        if (this.currentUser && this.currentUser.id) {
          this.loadPreferences(this.currentUser.id);
        }
      }
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
    console.log('Update profile requested');
    console.log('Current profile form value:', this.profileForm.value);
    console.log('Form valid:', this.profileForm.valid);

    if (this.profileForm.invalid || !this.currentUser?.id) {
      console.error('Form invalid or no current user');
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';
    console.log('Starting profile update');

    try {
      const updatedUser: User = {
        id: this.currentUser.id,
        fullName: this.profileForm.get('fullName')?.value,
        role: this.currentUser.role || '',
        photoProfile: this.currentUser.photoProfile || null,
        account: this.currentUser.account,
        preferences: this.currentUser.preferences || []
      };

      console.log('Updating profile with data:', updatedUser);

      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertUserToDTO(updatedUser)));      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });

      console.log('Reloading user data');
      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.snackBar.open('Error updating profile: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      console.log('Update completed, resetting update state');
      this.isUpdating = false;
      this.formState = 'default';
    }
  }

  async uploadProfilePhoto(): Promise<void> {
    if (!this.selectedFile || !this.currentUser?.id) {
      console.warn('Upload attempted with no file selected or no current user');
      this.snackBar.open('No file selected or user not found', 'Close', { duration: 3000 });
      return;
    }

    console.log('Starting profile photo upload for file:', this.selectedFile.name);
    this.isPhotoUploading = true;
    this.photoState = 'uploading';
    this.uploadProgress = 0;

    try {
      console.log('Converting file to base64');
      const base64Image = await this.fileToBase64(this.selectedFile);
      console.log('File converted to base64');

      const updatedUser: User = {
        ...this.currentUser,
        photoProfile: base64Image
      };
      console.log('Created updated user object with new photo');

      console.log('Sending update user request');
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertUserToDTO(updatedUser)));      this.snackBar.open('Profile photo uploaded successfully', 'Close', { duration: 3000 });
      this.selectedFile = null;
      this.uploadProgress = 100;

      console.log('Reloading user data to confirm changes');
      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      this.snackBar.open('Error uploading photo: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
      this.uploadProgress = 0;
    } finally {
      console.log('Upload completed, resetting upload state');
      this.isPhotoUploading = false;
      this.photoState = 'default';
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        console.log('File read successful');
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
    });
  }


  async updatePassword(): Promise<void> {
        console.log('Password change requested');

        if (this.passwordForm.invalid) {
          console.error('Password form is invalid');
          this.snackBar.open('Please fill in all required password fields correctly.', 'Close', { duration: 3000 });
          return;
        }

        if (!this.currentUser) {
          console.error('No current user available');
          this.snackBar.open('User data not available. Please refresh and try again.', 'Close', { duration: 3000 });
          return;
        }

        // Get account ID with proper null checking
        let accountId: string | undefined;

        if (this.currentUser.account && this.currentUser.account.id) {
          accountId = this.currentUser.account.id;
        } else if (this.currentUser.accountDTO && this.currentUser.accountDTO.id) {
          accountId = this.currentUser.accountDTO.id;
        }

        if (!accountId) {
          console.error('Cannot change password: No valid account ID available');
          this.snackBar.open('Error: No valid account data available', 'Close', { duration: 3000 });
          return;
        }

        const currentPassword = this.passwordForm.get('currentPassword')?.value;
        const newPassword = this.passwordForm.get('newPassword')?.value;

        if (!currentPassword || !newPassword) {
          console.error('Password values are missing');
          this.snackBar.open('Password fields cannot be empty', 'Close', { duration: 3000 });
          return;
        }

        this.isUpdating = true;
        this.formState = 'loading';

        try {
          await firstValueFrom(
            this.accountService.updatePassword(accountId, currentPassword, newPassword).pipe(
              catchError((error) => {
                console.error('Password update request failed:', error);
                // Check for specific error types
                if (error.status === 401 || error.status === 403) {
                  this.snackBar.open('Current password is incorrect', 'Close', { duration: 3000 });
                } else {
                  this.snackBar.open('Error changing password: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
                }
                throw error;
              })
            )
          );

          console.log('Password updated successfully');
          this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
          this.passwordForm.reset();
          this.setActiveCard(0);
        } catch (error: any) {
          console.error('Error changing password:', error);
          // Error already displayed in the catchError operator
        } finally {
          this.isUpdating = false;
          this.formState = 'default';
        }
      }
  private setProfileImage(url: string | null | undefined): void {
    if (!url) {
      this.profileImageSrc = 'assets/images/default-profile.png';
      return;
    }

    if (url.startsWith('data:image')) {
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(url);
    } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/=]+$/)) {
      const dataUrl = `data:image/jpeg;base64,${url}`;
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
    } else {
      this.profileImageSrc = url;
    }
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  openDeleteConfirmation(): void {
    console.log('🔔 Opening account deletion confirmation dialog');
    const dialogRef = this.dialog.open(this.deleteConfirmationDialog);

    dialogRef.afterClosed().subscribe((result) => {
      console.log('✅ Dialog closed with result:', result);
      if (result === true) {
        this.deleteAccount();
      } else {
        console.log('❌ Deletion cancelled');
      }
    });
  }

  deleteAccount(): void {
    console.log('🔴 Deleting user account');
    if (!this.currentUser?.accountDTO?.id) {
      console.error('User not found');
      this.snackBar.open('User not found. Please log in again.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.isUpdating = true;

    this.accountService.deleteAccount(this.currentUser?.accountDTO?.id).pipe(
      catchError((error) => {
        console.error('Error while deleting account:', error);
        this.snackBar.open('Error while deleting account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
        return of(null);
      }),
      finalize(() => {
        this.isLoading = false;
        this.isUpdating = false;
      })
    ).subscribe(() => {
      this.snackBar.open('Account successfully deleted', 'Close', { duration: 3000 });
      this.authService.logout();
    });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-profile.png';
  }

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

  private convertUserToDTO(user: User): UserDTO {
    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      creationDate: user.creationDate || new Date(),
      photoProfile: user.photoProfile || null,
      account: user.account ? {
        id: user.account.id,
        email: user.account.email
      } : null, // Or an appropriate default value
      preferences: user.preferences ? user.preferences.map(pref => ({
        id: pref.id || '',
        userId: pref.userId || user.id,
        category: pref.category,
        priority: pref.priority
      })) : []
    };
  }
}
