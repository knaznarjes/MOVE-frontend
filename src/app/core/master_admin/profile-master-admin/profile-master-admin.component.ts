/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
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

import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { PreferenceService } from '../../services/preference.service';
import { UserService } from '../../services/user.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Account, Preference, Role, User, UserDTO } from '../../models/models';

@Component({
    selector: 'app-profile-master-admin',
    templateUrl: './profile-master-admin.component.html',
    styleUrls: ['./profile-master-admin.component.scss'],
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
export class MasterAdminProfileComponent implements OnInit {
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  passwordForm: FormGroup;
  userRoleForm: FormGroup;

  userManagementForm: FormGroup;
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  selectedUserForRoleUpdate: User | null = null;
  selectedUserCurrentRole: string = '';
  displayedColumns: string[] = ['id', 'fullName', 'email', 'role', 'actions'];
  dataSource = new MatTableDataSource<User>();

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

  availableRoles: string[] = ['traveler', 'admin', 'masteradmin'];
  @ViewChild('deleteConfirmationDialog') deleteConfirmationDialog!: TemplateRef<any>;
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

    this.initForms();
  }

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

            this.setProfileImage((userData as User).photoProfile);
          } else {
            const account = userData as Account;
            this.currentUser = {
              id: account.id,
              fullName: '',
              role: '',
              photoProfile: null,
              account: account,
              preferences: []
            };
            console.log('Created User from Account:', this.currentUser);
            this.profileForm.patchValue({
              fullName: '',
              email: account.email
            });
            console.log('Form patched with account data:', this.profileForm.value);

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

  searchUsers(): void {
    console.log('Searching users');
    const name = this.userManagementForm.get('name')?.value;
    const email = this.userManagementForm.get('email')?.value;
    const role = this.userManagementForm.get('role')?.value;

    console.log('Search criteria:', { name, email, role });

    if (!name && !email && !role) {
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchTerm = filterValue.trim().toLowerCase();
    console.log('Filtering users with search term:', this.searchTerm);

    this.filteredUsers = this.users.filter(user =>
      user.fullName?.toLowerCase().includes(this.searchTerm) ||
      this.getEmailFromUser(user)?.toLowerCase().includes(this.searchTerm) ||
      user.id?.toLowerCase().includes(this.searchTerm)
    );
    console.log('Filtered users count:', this.filteredUsers.length);

    this.dataSource.data = this.filteredUsers;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  private setProfileImage(url: string | null): void {
    console.log('Setting profile image with URL:', url);

    if (!url) {
      console.log('No URL provided, using default image');
      this.profileImageSrc = 'assets/images/default-profile.png';
      return;
    }

    if (url.startsWith('data:image')) {
      console.log('URL is a data URL');
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(url);
    } else if (url.startsWith('/9j/') || url.match(/^[A-Za-z0-9+/=]+$/)) {
      console.log('URL is a base64 string without prefix, adding prefix');
      const dataUrl = `data:image/jpeg;base64,${url}`;
      this.profileImageSrc = this.sanitizer.bypassSecurityTrustUrl(dataUrl);
    } else {
      console.log('URL is a regular URL');
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
      console.log('Converting file to base64');
      const base64Image = await this.fileToBase64(this.selectedFile);
      console.log('File converted to base64');

      const updatedUser: User = {
        ...this.currentUser,
        photoProfile: base64Image
      };
      console.log('Created updated user object with new photo');

      console.log('Sending update user request');
      // Fix: Use the correct method name convertUserToDTO instead of convertToUserDTO
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertUserToDTO(updatedUser)));
      this.snackBar.open('Profile photo uploaded successfully', 'Close', { duration: 3000 });
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

      const updatedPreferences: Preference[] = [];

      for (const pref of preferencesFromForm) {
        if (pref.id) {
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
        role: this.currentUser.role || '',
        photoProfile: this.currentUser.photoProfile || null,
        account: this.currentUser.account,
        preferences: this.currentUser.preferences || []
      };

      console.log('Updating profile with data:', updatedUser);

      // Use the correct method name
      const userToUpdate = this.convertUserToDTO(updatedUser);
      await firstValueFrom(this.userService.updateUser(this.currentUser.id, userToUpdate));

      console.log('Profile updated successfully');
      this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });

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
          catchError(error => {
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
private getEmailFromUser(user: User): string {
    return user.account?.email || '';
  }

  viewUserDetails(user: User): void {
    console.log('Viewing user details:', user);
    this.selectedUser = user;
    this.activeCardIndex = 3;
  }
  openUpdateRoleDialog(user: User): void {
    // First check if user is a master admin
    if (this.isMasterAdmin(user)) {
      // Show a notification that master admin roles cannot be changed
      this.snackBar.open(
        'Master Admin roles cannot be modified for security reasons.',
        'Close',
        { duration: 3000 }
      );
      return; // Exit the method early without opening the dialog
    }

    // Initialize form with current role
    this.userRoleForm.get('role')?.setValue(user.role);
    this.selectedUserCurrentRole = user.role;
    this.selectedUserForRoleUpdate = user;

    // Open dialog as usual for non-protected users
    const dialogRef = this.dialog.open(this.userRoleUpdateDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(newRole => {
      if (newRole && newRole !== user.role) {
        this.updateUserRole(user.id, newRole);
      }
    });
  }

  updateUserRole(userId: string, role: string): void {
    // Double-check that we're not trying to update a master admin
    // This provides a second layer of security
    if (this.selectedUserForRoleUpdate && this.isMasterAdmin(this.selectedUserForRoleUpdate)) {
      this.snackBar.open(
        'Cannot change role: User has protected Master Admin status.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    console.log(`Updating user ${userId} role from ${this.selectedUserCurrentRole} to ${role}`);
    this.isUpdating = true;

    this.userService.updateUserRole(userId, role).subscribe({
      next: (updatedUser) => {
        this.snackBar.open(
          `User role updated from ${this.selectedUserCurrentRole} to ${role}`,
          'Close',
          { duration: 3000 }
        );

        this.loadAllUsers();

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
        this.isUpdating = false;
      }
    });
  }

  isMasterAdmin(user: User): boolean {
    // Case-insensitive check for protected admin roles
    const protectedRoles = ['masteradmin'];
    return user.role ? protectedRoles.includes(user.role.toLowerCase()) : false;
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
    console.log('Image loading error, using default');
    console.log('Failed image src:', event.target.src);
    event.target.src = 'assets/images/default-profile.png';
  }

  setActiveCard(index: number): void {
    console.log('Setting active card to index:', index);
    this.activeCardIndex = index;
  }

  navigateCards(direction: 'prev' | 'next'): void {
    const previousIndex = this.activeCardIndex;
    if (direction === 'prev' && this.activeCardIndex > 0) {
      this.activeCardIndex--;
    } else if (direction === 'next' && this.activeCardIndex < 3) {
      this.activeCardIndex++;
    }
    console.log(`Navigated ${direction} to card: from ${previousIndex} to ${this.activeCardIndex}`);
  }

search(): void {
    const formValues = this.userManagementForm.value;
    const name = formValues.name?.trim() || undefined;
    const email = formValues.email?.trim() || undefined;
    const role = formValues.role || undefined;

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

  resetSearch(): void {
    this.userManagementForm.reset();

    this.selectedUser = null;
    this.selectedUserCurrentRole = null;

    this.isLoading = true;

    this.loadAllUsers();
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
