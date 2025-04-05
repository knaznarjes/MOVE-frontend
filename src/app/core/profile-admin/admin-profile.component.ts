/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { of, firstValueFrom, Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { PreferenceService } from '../services/preference.service';
import { UserService } from '../services/user.service';
import { User, Preference, Account } from '../models/models';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-admin-profile',
    templateUrl: './admin-profile.component.html',
    styleUrls: ['./admin-profile.component.scss'],
    animations: [
      trigger('formAnimation', [  // Changé de 'formState' à 'formAnimation'
        state('default', style({ opacity: 1 })),
        state('loading', style({ opacity: 0.7 })),
        transition('* => *', animate('300ms ease-in-out'))
      ]),
      trigger('photoAnimation', [  // Changé de 'photoState' à 'photoAnimation'
        state('default', style({ opacity: 1 })),
        state('uploading', style({ opacity: 0.7 })),
        transition('* => *', animate('300ms ease-in-out'))
      ]),
      trigger('fadeIn', [  // Ajouté animation fadeIn
        state('void', style({ opacity: 0 })),
        state('*', style({ opacity: 1 })),
        transition(':enter', animate('300ms ease-in-out'))
      ])
    ]
  })
export class AdminProfileComponent implements OnInit {
  // Admin's personal profile forms
  profileForm: FormGroup;
  preferencesForm: FormGroup;

  // User management
  userManagementForm: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  displayedColumns: string[] = ['id', 'fullName', 'email', 'actions'];
  dataSource = new MatTableDataSource<User>();

  // State management
  isLoading = true;
  isUpdating = false;
  isLoadingUsers = false;
  currentUser: User | null = null;
  profileImageSrc: string | SafeUrl | null = null;
  selectedFile: File | null = null;
  userPreferences: Preference[] = [];
  uploadProgress: number = 0;
  isPhotoUploading: boolean = false;
  activeCardIndex: number = 0;
  photoState: string = 'default';
  formState: string = 'default';
  searchTerm: string = '';

  @ViewChild('deleteConfirmationDialog') deleteConfirmationDialog!: TemplateRef<any>;
  @ViewChild('userDeleteConfirmationDialog') userDeleteConfirmationDialog!: TemplateRef<any>;
  @ViewChild('userRoleUpdateDialog') userRoleUpdateDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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
    console.log('AdminProfileComponent constructor called');
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }]
    });

    this.preferencesForm = this.fb.group({
      preferences: this.fb.array([])
    });

    this.userManagementForm = this.fb.group({
      searchTerm: [''],
      userRole: ['user']
    });
    console.log('Forms initialized in constructor');
  }

  ngOnInit(): void {
    console.log('AdminProfileComponent initialized');
    const userId = localStorage.getItem('userId');
    console.log('User ID from localStorage:', userId);

    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('No valid user ID found in localStorage');
      this.snackBar.open('User not authenticated. Please log in again.', 'Close', { duration: 3000 });
      this.authService.logout();
      return;
    }

    console.log('Starting to load user data and all users...');
    this.loadUserData(userId);
    this.loadAllUsers();
  }

  // eslint-disable-next-line @angular-eslint/use-lifecycle-interface
  ngAfterViewInit() {
    console.log('ngAfterViewInit called');
    console.log('Paginator exists:', !!this.paginator);
    console.log('Sort exists:', !!this.sort);

    if (this.paginator && this.sort) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      console.log('Paginator and sort attached to dataSource');
    } else {
      console.warn('Paginator or Sort view child not initialized');
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
    console.log('Adding new preference field');
    this.preferencesArray.push(this.createPreferenceFormGroup());
    console.log('Preference fields count:', this.preferencesArray.length);
  }

  removePreferenceField(index: number): void {
    console.log('Removing preference field at index:', index);
    this.preferencesArray.removeAt(index);
    console.log('Preference fields count after removal:', this.preferencesArray.length);
  }

  loadUserData(userId: string): void {
    this.isLoading = true;
    this.formState = 'loading';
    console.log('Loading admin data for ID:', userId);

    this.userService.getUserById(userId).pipe(
      catchError((userError) => {
        console.error('User not found, trying account service:', userError);
        return this.accountService.getAccountById(userId).pipe(
          catchError((accountError) => {
            console.error('Account not found either:', accountError);
            this.snackBar.open('Admin profile not found. Please log in again.', 'Close', { duration: 3000 });
            this.authService.logout();
            return of(null);
          })
        );
      }),
      finalize(() => {
        console.log('Finished loading user data, loading state:', this.isLoading);
        this.isLoading = false;
        this.formState = 'default';
      })
    ).subscribe(
      (userData) => {
        console.log('User data received:', userData);
        if (userData) {
          console.log('User data type:', typeof userData);
          console.log('Has fullName property:', 'fullName' in userData);

          if ('fullName' in userData) {
            this.currentUser = userData as User;
            console.log('Processed as User, fullName:', this.currentUser.fullName);
            this.profileForm.patchValue({
              fullName: userData.fullName || '',
              email: userData.email
            });
            console.log('Form patched with user data:', this.profileForm.value);

            // Process the profile image URL properly
            this.setProfileImage((userData as User).photoProfile);
          } else {
            const account = userData as Account;
            console.log('Processed as Account, fullName:', account.fullName);
            this.currentUser = {
              id: account.id,
              fullName: account.fullName || '',
              email: account.email,
              photoProfile: account.profilePhotoUrl || null,
              preferences: []
            };
            console.log('Created User from Account:', this.currentUser);
            this.profileForm.patchValue({
              fullName: account.fullName || '',
              email: account.email
            });
            console.log('Form patched with account data:', this.profileForm.value);

            // Process the profile image URL properly
            this.setProfileImage(account.profilePhotoUrl);
          }

          if (this.currentUser) {
            console.log('Loading preferences for current user:', this.currentUser.id);
            this.loadPreferences(this.currentUser.id);
          } else {
            console.error('Current user is null after processing userData');
          }
        } else {
          console.error('userData is null or undefined');
        }
      },
      (error) => {
        console.error('Error in subscribe callback:', error);
      }
    );
  }

  // Load all users for admin management
  loadAllUsers(): void {
    this.isLoadingUsers = true;
    console.log('Loading all users');

    this.userService.getAllUsers().pipe(
      catchError((error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error loading user list: ' + error.message, 'Close', { duration: 3000 });
        return of([]);
      }),
      finalize(() => {
        console.log('Finished loading all users');
        this.isLoadingUsers = false;
      })
    ).subscribe(
      (users) => {
        console.log('Users loaded:', users);
        console.log('Users array type:', Array.isArray(users));
        console.log('Users count:', users ? users.length : 0);

        this.users = users || [];
        this.filteredUsers = [...this.users];
        this.dataSource.data = this.filteredUsers;
        console.log('DataSource data set with', this.dataSource.data.length, 'users');

        if (this.dataSource.paginator) {
          console.log('Resetting paginator to first page');
          this.dataSource.paginator.firstPage();
        } else {
          console.warn('Paginator not available when setting data');
        }
      },
      (error) => {
        console.error('Error in loadAllUsers subscribe callback:', error);
      }
    );
  }

  // Filter users based on search term
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    console.log('Filtering users with search term:', this.searchTerm);

    this.filteredUsers = this.users.filter(user =>
      user.fullName?.toLowerCase().includes(this.searchTerm) ||
      user.email?.toLowerCase().includes(this.searchTerm) ||
      user.id?.toLowerCase().includes(this.searchTerm)
    );
    console.log('Filtered users count:', this.filteredUsers.length);

    this.dataSource.data = this.filteredUsers;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Helper method to properly set the profile image
  private setProfileImage(url: string | null): void {
    console.log('Setting profile image with URL:', url);

    if (!url) {
      console.log('No URL provided, using default image');
      this.profileImageSrc = 'assets/images/default-profile.png';
      return;
    }

    // Check if it's a base64 string
    if (url.startsWith('data:image')) {
      console.log('URL is a data URL');
      // It's already a data URL, use as is
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(url);
    } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/=]+$/)) {
      console.log('URL is a base64 string without prefix, adding prefix');
      // It looks like a base64 string without the data:image prefix
      const dataUrl = `data:image/jpeg;base64,${url}`;
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
    } else {
      console.log('URL is a regular URL');
      // Assume it's a regular URL
      this.profileImageSrc = url;
    }

    console.log('Profile image source set');
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
      // Convert file to base64
      console.log('Converting file to base64');
      const base64Image = await this.fileToBase64(this.selectedFile);
      console.log('File converted to base64');

      // Create updated user object with the base64 image
      const updatedUser: User = {
        ...this.currentUser,
        photoProfile: base64Image
      };
      console.log('Created updated user object with new photo');

      // Update user with base64 image instead of file upload
      console.log('Sending update user request');
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, updatedUser));
      console.log('Update user request completed successfully');

      this.snackBar.open('Profile photo uploaded successfully', 'Close', { duration: 3000 });
      this.selectedFile = null;
      this.uploadProgress = 100;

      // Reload user data to confirm changes
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
      reader.onerror = error => {
        console.error('Error reading file:', error);
        reject(error);
      };
    });
  }

  loadPreferences(userId: string): void {
    console.log('Loading preferences for user ID:', userId);

    this.preferenceService.getUserPreferences(userId).pipe(
      catchError((error) => {
        console.error('Error loading preferences:', error);
        this.snackBar.open('Error loading preferences: ' + error.message, 'Close', { duration: 3000 });
        return of([]);
      })
    ).subscribe(
      (preferences) => {
        console.log('Preferences loaded:', preferences);
        this.userPreferences = preferences || [];
        this.preferencesArray.clear();
        console.log('Cleared preferences array');

        if (preferences && preferences.length > 0) {
          console.log('Adding', preferences.length, 'preferences to form array');
          preferences.forEach(pref => {
            const group = this.fb.group({
              id: [pref.id || ''],
              category: [pref.category, Validators.required],
              priority: [pref.priority, Validators.required]
            });
            this.preferencesArray.push(group);
            console.log('Added preference to form array:', group.value);
          });
        } else {
          console.log('No preferences found, adding empty field');
          this.addPreferenceField();
        }

        console.log('Final preferences form value:', this.preferencesForm.value);
      },
      (error) => {
        console.error('Error in preferences subscribe callback:', error);
      }
    );
  }

  onFileSelected(event: Event): void {
    console.log('File selection event triggered');
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length) {
      this.selectedFile = element.files[0];
      console.log('File selected:', this.selectedFile.name, 'Type:', this.selectedFile.type);

      if (!this.selectedFile.type.startsWith('image/')) {
        console.error('Invalid file type selected:', this.selectedFile.type);
        this.snackBar.open('Invalid file type. Please upload an image.', 'Close', { duration: 3000 });
        this.selectedFile = null;
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('File read completed');
        const result = e.target?.result as string;
        this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(result);
        console.log('Preview image set');
      };
      console.log('Starting file read');
      reader.readAsDataURL(this.selectedFile);
    } else {
      console.log('No file selected or selection canceled');
    }
  }

  async updatePreferences(): Promise<void> {
    console.log('Update preferences requested');
    console.log('Current preferences form value:', this.preferencesForm.value);
    console.log('Form valid:', this.preferencesForm.valid);

    if (this.preferencesForm.invalid || !this.currentUser?.id) {
      console.error('Form invalid or no current user');
      this.snackBar.open('Please fill in all required preference fields.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';
    console.log('Starting preferences update');

    try {
      const preferencesToSave: Preference[] = this.preferencesArray.value.map((pref: any) => ({
        id: pref.id || undefined,
        userId: this.currentUser?.id,
        category: pref.category,
        priority: pref.priority
      }));

      console.log('Saving preferences:', preferencesToSave);

      const updatePromises = preferencesToSave.map(pref => {
        if (pref.id) {
          console.log('Updating existing preference:', pref.id);
          return firstValueFrom(this.preferenceService.updatePreference(pref.id, pref));
        } else {
          console.log('Creating new preference');
          return firstValueFrom(this.preferenceService.createPreference(pref));
        }
      });

      await Promise.all(updatePromises);
      console.log('All preferences saved successfully');

      this.snackBar.open('Preferences updated successfully', 'Close', { duration: 3000 });
      console.log('Reloading preferences');
      this.loadPreferences(this.currentUser.id);
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      this.snackBar.open('Error updating preferences: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      console.log('Update completed, resetting update state');
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
        email: this.profileForm.get('email')?.value,
        photoProfile: this.currentUser.photoProfile || null,
        preferences: this.currentUser.preferences || []
      };

      console.log('Updating profile with data:', updatedUser);

      await firstValueFrom(this.userService.updateUser(this.currentUser.id, updatedUser));
      console.log('Profile updated successfully');
      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });

      // Reload the data to see the changes
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

  // View user details
  viewUserDetails(user: User): void {
    console.log('Viewing user details:', user);
    this.selectedUser = user;
    this.activeCardIndex = 3; // Switch to user details tab
  }

  // Open dialog to update user role
  openUpdateRoleDialog(user: User): void {
    console.log('Opening update role dialog for user:', user);
    this.selectedUser = user;
    const dialogRef = this.dialog.open(this.userRoleUpdateDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((role) => {
      console.log('Dialog closed with role:', role);
      if (role && this.selectedUser) {
        this.updateUserRole(this.selectedUser.id, role);
      } else {
        console.log('No role selected or user is null, skipping update');
      }
    });
  }

  // Update user role
  async updateUserRole(userId: string, role: string): Promise<void> {
    console.log(`Updating user ${userId} role to ${role}`);
    try {
      await firstValueFrom(this.userService.updateUserRole(userId, role));
      console.log('User role update successful');
      this.snackBar.open(`User role updated to ${role} successfully`, 'Close', { duration: 3000 });
      this.loadAllUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating user role:', error);
      this.snackBar.open('Error updating user role: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    }
  }

  // Open dialog to confirm user deletion
  openUserDeleteConfirmation(user: User): void {
    console.log('Opening delete confirmation for user:', user);
    this.selectedUser = user;
    const dialogRef = this.dialog.open(this.userDeleteConfirmationDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed with result:', result);
      if (result === true && this.selectedUser) {
        this.deleteUser(this.selectedUser.id);
      } else {
        console.log('Deletion canceled or user is null');
      }
    });
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    console.log('Starting user deletion process for ID:', userId);
    try {
      // First delete user preferences
      console.log('Deleting user preferences');
      await firstValueFrom(this.preferenceService.deleteUserPreferences(userId));
      console.log('User preferences deleted successfully');

      // Then delete the user
      console.log('Deleting user');
      await firstValueFrom(this.userService.deleteUser(userId));
      console.log('User deleted successfully');

      this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
      this.loadAllUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting user:', error);
      this.snackBar.open('Error deleting user: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    }
  }

  // Open dialog to confirm admin account deletion
  openDeleteConfirmation(): void {
    console.log('Opening admin account deletion confirmation dialog');
    const dialogRef = this.dialog.open(this.deleteConfirmationDialog);

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed with result:', result);
      if (result === true) {
        this.deleteAccount();
      } else {
        console.log('Account deletion canceled');
      }
    });
  }

  // Delete admin account
  async deleteAccount(): Promise<void> {
    console.log('Starting admin account deletion process');
    if (!this.currentUser?.id || !this.currentUser?.email) {
      console.error('No current user ID or email');
      return;
    }

    try {
      this.isUpdating = true;
      console.log('Deleting account for user:', this.currentUser.email);

      // 1. Delete user preferences
      console.log('Deleting user preferences');
      await firstValueFrom(this.preferenceService.deleteUserPreferences(this.currentUser.id).pipe(
        catchError((error) => {
          console.error('Error deleting preferences:', error);
          this.snackBar.open('Error deleting preferences: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          throw error;
        })
      ));
      console.log('User preferences deleted successfully');

      // 2. Delete account using email instead of ID
      console.log('Deleting account by email:', this.currentUser.email);
      await firstValueFrom(this.accountService.deleteAccountByEmail(this.currentUser.email).pipe(
        catchError((error) => {
          console.error('Error deleting account:', error);
          this.snackBar.open('Error deleting account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          throw error;
        })
      ));
      console.log('Account deleted successfully');

      this.snackBar.open('Account deleted successfully.', 'Close', { duration: 3000 });

      // Logout after deleting the account
      console.log('Logging out after account deletion');
      this.authService.logout();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      this.snackBar.open('Error deleting account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
    }
  }

  handleImageError(event: any): void {
    console.log('Image loading error, using default');
    console.log('Failed image src:', event.target.src);
    event.target.src = 'assets/images/default-profile.png';
  }

  // Methods for card navigation
  setActiveCard(index: number): void {
    console.log('Setting active card to index:', index);
    this.activeCardIndex = index;
  }

  navigateCards(direction: 'prev' | 'next'): void {
    const previousIndex = this.activeCardIndex;
    if (direction === 'prev' && this.activeCardIndex > 0) {
      this.activeCardIndex--;
    } else if (direction === 'next' && this.activeCardIndex < 3) { // Updated to include the new user management tab
      this.activeCardIndex++;
    }
    console.log(`Navigated ${direction} to card: from ${previousIndex} to ${this.activeCardIndex}`);
  }
}
