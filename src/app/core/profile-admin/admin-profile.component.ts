/* eslint-disable arrow-parens */
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
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Account, Preference, Role, User, UserDTO } from '../models/models';

@Component({
    selector: 'app-admin-profile',
    templateUrl: './admin-profile.component.html',
    styleUrls: ['./admin-profile.component.scss'],
    animations: [
      trigger('formAnimation', [
        state('default', style({ opacity: 1 })),
        state('loading', style({ opacity: 0.7 })),
        transition('* => *', animate('300ms ease-in-out'))
      ]),
      trigger('photoAnimation', [
        state('default', style({ opacity: 1 })),
        state('uploading', style({ opacity: 0.7 })),
        transition('* => *', animate('300ms ease-in-out'))
      ]),
      trigger('fadeIn', [
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
  passwordForm: FormGroup; // Added password form
  userRoleForm: FormGroup;

  // User management
  userManagementForm: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  selectedUserCurrentRole: string = ''; // Add property to store current role
  displayedColumns: string[] = ['id', 'fullName', 'email', 'role', 'actions'];
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

  // Define available roles for dropdown
  availableRoles: string[] = ['user', 'admin', 'moderator', 'editor'];

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
      name: [''],
      email: [''],
      role: ['']
    });

    // Appel de la méthode d'initialisation ici
    this.initForms();
  }

  // ✅ Déplacé à l'extérieur du constructeur
  private initForms(): void {
    this.userRoleForm = this.fb.group({
      role: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    console.log('Forms initialized in initForms');
  }

  // ✅ Fonction de validation pour les mots de passe
  private passwordMatchValidator(form: FormGroup): null | object {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
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
      setTimeout(() => {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        console.log('Paginator and sort attached to dataSource');
      });
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
              email: this.getEmailFromUser(userData as User) // Use helper method
            });
            console.log('Form patched with user data:', this.profileForm.value);

            // Process the profile image URL properly
            this.setProfileImage((userData as User).photoProfile);
          } else {
            const account = userData as Account;
            // Create a User object from Account data
            // Make sure we're creating a compatible User object without email
            this.currentUser = {
              id: account.id,
              fullName: '', // Set empty or fetch from elsewhere if available
              role: '', // Set empty or fetch from elsewhere if available
              photoProfile: null,
              account: account, // Store the account reference for email access
              preferences: []
            };
            console.log('Created User from Account:', this.currentUser);
            this.profileForm.patchValue({
              fullName: '', // Set empty or fetch from elsewhere
              email: account.email
            });
            console.log('Form patched with account data:', this.profileForm.value);

            // Process the profile image URL properly - account doesn't have this
            this.setProfileImage(null);
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

  // Fixed: Load all users for admin management
  loadAllUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open(
          `Error loading users: ${error.message || 'Unknown error'}`,
          'Close',
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  // Fixed: Enhanced search method using the UserService
  searchUsers(): void {
    console.log('Searching users');
    const name = this.userManagementForm.get('name')?.value;
    const email = this.userManagementForm.get('email')?.value;
    const role = this.userManagementForm.get('role')?.value;

    console.log('Search criteria:', { name, email, role });

    if (!name && !email && !role) {
      // If no search criteria, load all users
      this.loadAllUsers();
      return;
    }

    this.isLoadingUsers = true;

    this.userService.searchUsers(name, email, role).pipe(
      catchError((error) => {
        console.error('Error searching users:', error);
        this.snackBar.open('Error searching users: ' + error.message, 'Close', { duration: 3000 });
        return of([]);
      }),
      finalize(() => {
        this.isLoadingUsers = false;
      })
    ).subscribe(users => {
      console.log('Search results:', users);
      this.filteredUsers = users || [];
      this.dataSource.data = this.filteredUsers;

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  // Legacy filter method (can keep for client-side filtering)
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    console.log('Filtering users with search term:', this.searchTerm);

    this.filteredUsers = this.users.filter(user =>
      user.fullName?.toLowerCase().includes(this.searchTerm) ||
      this.getEmailFromUser(user)?.toLowerCase().includes(this.searchTerm) || // Use helper method
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
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertToUserDTO(updatedUser)));
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
              id: [pref.id || ''], // Ensure ID is included for existing preferences
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

 // In admin-profile.component.ts, replace the updatePreferences method with this:

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
      const preferencesFromForm = this.preferencesArray.value;
      const originalPreferences = [...this.userPreferences];

      // Track successful operations
      const updatedPreferences: Preference[] = [];

      // Process each preference from the form
      for (const pref of preferencesFromForm) {
        if (pref.id) {
          // Update existing preference
          console.log('Updating existing preference:', pref);
          const updatedPref = await firstValueFrom(
            this.preferenceService.updatePreference(pref.id, {
              id: pref.id,
              userId: this.currentUser.id,
              category: pref.category,
              priority: pref.priority
            })
          );
          updatedPreferences.push(updatedPref);
        } else {
          // Create new preference
          console.log('Creating new preference:', pref);
          const newPref = await firstValueFrom(
            this.preferenceService.createPreference({
              userId: this.currentUser.id,
              category: pref.category,
              priority: pref.priority
            })
          );
          updatedPreferences.push(newPref);
        }
      }

      // Check for deleted preferences (ones that were in original but not in form)
      for (const originalPref of originalPreferences) {
        const stillExists = preferencesFromForm.some(p => p.id === originalPref.id);
        if (!stillExists && originalPref.id) {
          console.log('Deleting removed preference:', originalPref);
          await firstValueFrom(
            this.preferenceService.deletePreference(originalPref.id)
          );
        }
      }

      console.log('All preferences saved successfully');
      this.snackBar.open('Preferences updated successfully', 'Close', { duration: 3000 });

      // Reload preferences to show the updated list
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
        role: this.currentUser.role || '', // Add role from currentUser
        photoProfile: this.currentUser.photoProfile || null,
        account: this.currentUser.account, // Preserve account
        preferences: this.currentUser.preferences || []
      };

      console.log('Updating profile with data:', updatedUser);

      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertToUserDTO(updatedUser)));      console.log('Profile updated successfully');
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
  async changePassword(): Promise<void> {
    console.log('Password change requested');

    if (this.passwordForm.invalid || !this.currentUser?.id) {
      this.snackBar.open('Please fill in all required password fields correctly.', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';

    try {
      // Get current password and new password from form
      const currentPassword = this.passwordForm.get('currentPassword')?.value;
      const newPassword = this.passwordForm.get('newPassword')?.value;

      if (!currentPassword || !newPassword) {
        throw new Error('Password fields cannot be empty');
      }

      // You might need to adjust this based on your account service implementation
      await firstValueFrom(
        this.accountService.updatePassword(this.currentUser.id, currentPassword, newPassword)
      );

      this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      this.passwordForm.reset();
      this.setActiveCard(0); // Return to profile page
    } catch (error: any) {
      console.error('Error changing password:', error);
      this.snackBar.open('Error changing password: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
    } finally {
      this.isUpdating = false;
      this.formState = 'default';
    }
  }
private getEmailFromUser(user: User): string {
    // Check if account property exists and has email
    return user.account?.email || '';
  }

  // View user details
  viewUserDetails(user: User): void {
    console.log('Viewing user details:', user);
    this.selectedUser = user;
    this.activeCardIndex = 3; // Switch to user details tab
  }

  // Modified to store current role before opening dialog
  openUpdateRoleDialog(user: User): void {
    console.log('Opening update role dialog for user:', user);
    this.selectedUser = user;

    // Store the current role before opening the dialog
    this.selectedUserCurrentRole = user.role || 'user';
    console.log('Current user role:', this.selectedUserCurrentRole);

    // Make sure the form is defined before using patchValue
    if (!this.userRoleForm) {
      this.initForms();
    }

    // Reset the userRoleForm with the current role as value
    this.userRoleForm.patchValue({
      role: this.selectedUserCurrentRole
    });

    const dialogRef = this.dialog.open(this.userRoleUpdateDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((role) => {
      console.log('Dialog closed with role:', role);
      if (role && this.selectedUser && role !== this.selectedUserCurrentRole) {
        this.updateUserRole(this.selectedUser.id, role);
      } else {
        console.log('No role selected, same role selected, or user is null, skipping update');
      }
    });
  }
  // Update user role with improved feedback and proper enum handling
  updateUserRole(userId: string, role: string): void {
    console.log(`Updating user ${userId} role from ${this.selectedUserCurrentRole} to ${role}`);

    this.isUpdating = true; // Disable UI actions during update

    this.userService.updateUserRole(userId, role).subscribe({
      next: (updatedUser) => {
        // Show success notification
        this.snackBar.open(
          `User role updated from ${this.selectedUserCurrentRole} to ${role}`,
          'Close',
          { duration: 3000 }
        );

        // Reload the user list
        this.loadAllUsers();

        // Update selected user data if still selected
        if (this.selectedUser?.id === userId) {
          this.selectedUser = updatedUser;
          this.selectedUserCurrentRole = updatedUser.role;
        }
      },
      error: (error) => {
        console.error('Error updating user role:', error);
        this.snackBar.open(
          `Error updating user role: ${error.message || 'Unknown error'}`,
          'Close',
          { duration: 3000 }
        );
      },
      complete: () => {
        this.isUpdating = false; // Re-enable UI
      }
    });
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
    if (!this.currentUser?.id || !this.currentUser?.account?.email) {
      console.error('No current user ID or email via account');
      return;
    }

    try {
      this.isUpdating = true;
      console.log('Deleting account for user:', this.currentUser.account.email);

      // Delete user through the user service
      console.log('Deleting user account by ID:', this.currentUser.id);
      await firstValueFrom(this.userService.deleteUser(this.currentUser.id).pipe(
        catchError((error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open('Error deleting user: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          throw error;
        })
      ));
      console.log('User deleted successfully');

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
  /**
   * Helper method to create a valid User object with account
   * This ensures the object structure matches the User interface
   */
  private createValidUserObject(userData: any): User {
    let email = '';

    // Determine where to get the email from
    if (userData.account && userData.account.email) {
      // New structure: email in account
      email = userData.account.email;
    } else if (userData.email) {
      // Old structure: direct email property
      email = userData.email;
    }

    // Create user with proper structure
    return {
      id: userData.id || '',
      fullName: userData.fullName || '',
      role: userData.role || '',
      photoProfile: userData.photoProfile || null,
      // Ensure account exists with email
      account: {
        id: userData.account?.id || userData.id,
        email: email
      },
      preferences: userData.preferences || []
    };
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

 // Method to search users based on form values
search(): void {
    const formValues = this.userManagementForm.value;
    const name = formValues.name?.trim() || undefined;
    const email = formValues.email?.trim() || undefined;
    const role = formValues.role || undefined;

    // Show loading state
    this.isLoading = true;

    this.userService.searchUsers(name, email, role)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (users) => {
          this.users = users;
          if (users.length === 0) {
            this.snackBar.open('No users found matching your criteria', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.snackBar.open(
            'Error searching users: ' + (error.message || 'Unknown error'),
            'Close',
            { duration: 3000 }
          );
        }
      });
  }

  // Reset search form and reload all users
  resetSearch(): void {
    // Reset all form fields
    this.userManagementForm.reset();

    // Clear any selected user
    this.selectedUser = null;
    this.selectedUserCurrentRole = null;

    // Show loading state
    this.isLoading = true;

    // Load all users again
    this.loadAllUsers();
  }
  private convertToUserDTO(user: User): UserDTO {
    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      creationDate: user.creationDate || new Date(), // Provide default if missing
      photoProfile: user.photoProfile || undefined,
      accountDTO: user.account ? {
        id: user.account.id || '',
        email: user.account.email,
        password: user.account.password
      } : undefined,
      preferences: user.preferences?.map(pref => ({
        id: pref.id || '',
        userId: pref.userId || '',
        category: pref.category,
        priority: pref.priority
      }))
    };
  }
}
