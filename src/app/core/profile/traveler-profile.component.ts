import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { PreferenceService } from '../services/preference.service';
import { UserService } from '../services/user.service';
import { User, Preference, Account } from '../models/models';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-traveler-profile',
  templateUrl: './traveler-profile.component.html',
  styleUrls: ['./traveler-profile.component.scss']
})
export class TravelerProfileComponent implements OnInit {
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  isLoading = true;
  isUpdating = false;
  currentUser: User | null = null;
  profileImageSrc: string | null = null;
  selectedFile: File | null = null;
  userPreferences: Preference[] = [];
  uploadProgress: number = 0;
  isPhotoUploading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private accountService: AccountService,
    private preferenceService: PreferenceService,
    private userService: UserService,
    private snackBar: MatSnackBar
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

  // eslint-disable-next-line @typescript-eslint/member-ordering
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
      finalize(() => this.isLoading = false)
    ).subscribe((userData) => {
      if (userData) {
        if ('fullName' in userData) {
          this.currentUser = userData as User;
          this.profileForm.patchValue({
            fullName: userData.fullName || '',
            email: userData.email
          });

          if ('profilePhotoUrl' in userData) {
            this.profileImageSrc = (userData as User).profilePhotoUrl;
          } else {
            this.profileImageSrc = null;
          }
        } else {
          const account = userData as Account;
          this.currentUser = {
            id: userId,
            fullName: account.fullName || '',
            email: account.email,
            profilePhotoUrl: null
          };
          this.profileForm.patchValue({
            fullName: account.fullName || '',
            email: account.email
          });
          this.profileImageSrc = account.profilePhotoUrl || null;
        }

        if (this.currentUser) {
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
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      reader.onload = e => this.profileImageSrc = e.target?.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async uploadProfilePhoto(): Promise<void> {
    if (!this.selectedFile || !this.currentUser?.id) {
      return;
    }

    this.isPhotoUploading = true;
    this.uploadProgress = 0;

    try {
      const progressInterval = setInterval(() => {
        if (this.uploadProgress < 90) {
          this.uploadProgress += 10;
        }
      }, 300);

      await firstValueFrom(this.userService.uploadProfilePhoto(this.currentUser.id, this.selectedFile));

      clearInterval(progressInterval);
      this.uploadProgress = 100;
      this.selectedFile = null;
      this.snackBar.open('Profile photo uploaded successfully', 'Close', { duration: 3000 });

      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      this.snackBar.open('Error uploading photo: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isPhotoUploading = false;
    }
  }

  async updatePreferences(): Promise<void> {
    if (this.preferencesForm.invalid || !this.currentUser?.id) {
      this.snackBar.open('Please fill in all required preference fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;

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
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid || !this.currentUser?.id) {
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;

    try {
      const updatedUser: User = {
        id: this.currentUser.id,
        fullName: this.profileForm.get('fullName')?.value,
        email: this.profileForm.get('email')?.value,
        profilePhotoUrl: this.currentUser.profilePhotoUrl || null
      };

      await firstValueFrom(this.userService.updateUser(this.currentUser.id, updatedUser));
      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });

      // Recharger les données pour voir les modifications
      this.loadUserData(this.currentUser.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.snackBar.open('Error updating profile: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
    }
  }
  async deleteAccount(): Promise<void> {
    if (!this.currentUser?.id || !this.currentUser?.email) {
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
      await firstValueFrom(this.accountService.deleteAccountByEmail(this.currentUser.email).pipe(
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
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  handleImageError(event: any) {
    event.target.src = 'assets/images/default-profile.png';
  }
}
