/* eslint-disable curly */
/* eslint-disable arrow-body-style */
/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable arrow-parens */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { MatSort } from '@angular/material/sort';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, finalize, switchMap, map, tap } from 'rxjs/operators';
import { of, firstValueFrom, Observable, throwError } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { PreferenceService } from '../../services/preference.service';
import { UserService } from '../../services/user.service';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Account, Preference, PreferenceDTO, Role, User, UserDTO } from '../../models/models';

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
  profileForm: UntypedFormGroup;
  preferencesForm: UntypedFormGroup;
  passwordForm: UntypedFormGroup;
  userRoleForm: UntypedFormGroup;

  userManagementForm: UntypedFormGroup;
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
  private emailCache: Map<string, string> = new Map();

  availableRoles: string[] = ['TRAVELER', 'ADMIN', 'MASTERADMIN'];
  @ViewChild('deleteConfirmationDialog') deleteConfirmationDialog!: TemplateRef<any>;
  @ViewChild('userRoleUpdateDialog') userRoleUpdateDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
    router: any;

  constructor(
    private fb: UntypedFormBuilder,
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

  private passwordMatchValidator(form: UntypedFormGroup): null | object {
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

        this.dataSource.filterPredicate = (user: User, filter: string) => {
          return (
            user.fullName?.toLowerCase().includes(filter) ||
            (user.id?.toLowerCase().includes(filter)) ||
            (this.emailCache.get(user.accountId || '')?.toLowerCase().includes(filter))
          );
        };
      });
    } else {
      console.warn('Paginator or Sort view child not initialized');
    }
  }

  get preferencesArray(): UntypedFormArray {
    return this.preferencesForm.get('preferences') as UntypedFormArray;
  }
  isCategoryAlreadySelected(category: string, currentIndex: number): boolean {
    const preferencesArray = this.preferencesForm.get('preferences') as UntypedFormArray;

    for (let i = 0; i < preferencesArray.length; i++) {
      if (i !== currentIndex) { // Ne pas vérifier l'élément actuel
        const pref = preferencesArray.at(i);
        if (pref.get('category')?.value === category) {
          return true;
        }
      }
    }
    return false;
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
          if ('fullName' in userData) {
            this.currentUser = userData as User;

            if (!this.currentUser.accountId && userData.account && userData.account.id) {
              this.currentUser.accountId = userData.account.id;
              console.log('Setting accountId from account object:', this.currentUser.accountId);
            }

            if (this.currentUser.accountId) {
              this.fetchAndSetEmail(this.currentUser.accountId);
            }

            this.profileForm.patchValue({
              fullName: this.currentUser.fullName || ''
            });

            console.log('Form patched with user data:', this.profileForm.value);
            console.log('Current user accountId:', this.currentUser.accountId);
            this.setProfileImage(this.currentUser.photoProfile);
          } else {
            const account = userData as Account;
            this.currentUser = {
              id: account.id!,
              fullName: '',
              role: Role.MASTERADMIN,
              photoProfile: null,
              accountId: account.id,
              preferences: [],
              accountLocked: false,
              enabled: true
            };
            console.log('Current user accountId from account:', this.currentUser.accountId);
            this.profileForm.patchValue({
              fullName: '',
              email: account.email
            });
            console.log('Form patched with account data:', this.profileForm.value);
            this.setProfileImage(null);
          }

          if (this.currentUser) {
            console.log('Loading preferences for current user:', this.currentUser.id);
            this.loadPreferences(this.currentUser.id!);
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
        this.users = users.map(userDTO => this.convertDTOToUser(userDTO));
        this.filteredUsers = [...this.users];
        this.dataSource.data = this.users;
        this.isLoading = false;

        this.prefetchEmails(this.users);
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

  private prefetchEmails(users: User[]): void {
    users.forEach(user => {
      if (user.accountId && !this.emailCache.has(user.accountId)) {
        this.accountService.getAccountById(user.accountId).subscribe({
          next: (account) => {
            if (account && account.email) {
              this.emailCache.set(user.accountId!, account.email);
            }
          },
          error: (error) => {
            console.error(`Error fetching email for user ${user.id}:`, error);
          }
        });
      }
    });
  }

  private convertDTOToUser(userDTO: any): User {
    if ('account' in userDTO && userDTO.account && 'id' in userDTO.account) {
      return {
        id: userDTO.id,
        fullName: userDTO.fullName,
        role: userDTO.role,
        photoProfile: userDTO.photoProfile,
        accountId: userDTO.account.id,
        preferences: userDTO.preferences || [],
        accountLocked: userDTO.accountLocked || false,
        enabled: userDTO.enabled || true,
        creationDate: userDTO.creationDate,
        modifiedAt: userDTO.modifiedAt
      };
    }

    return {
      id: userDTO.id,
      fullName: userDTO.fullName,
      role: userDTO.role,
      photoProfile: userDTO.photoProfile,
      accountId: userDTO.accountId || (userDTO.account?.id),
      preferences: userDTO.preferences || [],
      accountLocked: userDTO.accountLocked || false,
      enabled: userDTO.enabled || true,
      creationDate: userDTO.creationDate,
      modifiedAt: userDTO.modifiedAt
    };
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
    this.preferenceService.getCurrentUserPreferences().pipe(

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
      const email = this.profileForm.get('email')?.value ||
                    (this.currentUser.accountId ? this.emailCache.get(this.currentUser.accountId) : '');

      const updatedUser: User = {
        ...this.currentUser,
        fullName: this.profileForm.get('fullName')?.value,
      };

      console.log('Updating profile with data:', updatedUser);

      const userToUpdate = this.convertUserToDTO(updatedUser);

      console.log('Data being sent to API:', userToUpdate);

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

    if (!this.currentUser?.accountId) {
      console.error('No current user available');
      this.snackBar.open('User data not available. Please refresh and try again.', 'Close', { duration: 3000 });
      return;
    }

    const accountId = this.currentUser.accountId;
    const newPassword = this.passwordForm.get('newPassword')?.value;

    if (!newPassword) {
      console.error('New password value is missing');
      this.snackBar.open('New password field cannot be empty', 'Close', { duration: 3000 });
      return;
    }

    this.isUpdating = true;
    this.formState = 'loading';

    try {
      await firstValueFrom(
        this.accountService.updatePassword(accountId, newPassword).pipe(
          catchError(error => {
            const errorMsg = error.error?.message || error.message || 'Unknown error';
            console.error('Password update error:', error);
            this.snackBar.open(`Error: ${errorMsg}`, 'Close', { duration: 3000 });
            this.isUpdating = false;
            this.formState = 'default';
            throw error;
          })
        )
      );

      console.log('Password updated successfully');
      this.snackBar.open('Password changed successfully. Please log in with your new password.', 'Close', { duration: 5000 });
      this.passwordForm.reset();
      this.setActiveCard(0);

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000);
    } catch (error) {
      console.log('Error caught in main try/catch block:', error);
    } finally {
      this.isUpdating = false;
      this.formState = 'default';
    }
  }

  openUpdateRoleDialog(user: User): void {
    if (this.isMasterAdmin(user)) {
      this.snackBar.open(
        'Master Admin roles cannot be modified for security reasons.',
        'Close',
        { duration: 3000 }
      );
      return;
    }
    this.userRoleForm.get('role')?.setValue(user.role);
    this.selectedUserCurrentRole = user.role;
    this.selectedUserForRoleUpdate = user;

    const dialogRef = this.dialog.open(this.userRoleUpdateDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(newRole => {
      if (newRole && newRole !== user.role) {
        this.updateUserRole(user.id!, newRole);
      }
    });
  }
  updateUserRole(userId: string, roleStr: string): void {
    if (this.selectedUserForRoleUpdate && this.isMasterAdmin(this.selectedUserForRoleUpdate)) {
      this.snackBar.open(
        'Cannot change role: User has protected Master Admin status.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    console.log(`Updating user ${userId} role from ${this.selectedUserCurrentRole} to ${roleStr}`);
    this.isUpdating = true;

    const role = roleStr as Role;

    this.userService.updateUserRole(userId, role).subscribe({
      next: (updatedUserDTO: UserDTO) => {
        this.snackBar.open(
          `User role updated from ${this.selectedUserCurrentRole} to ${role}`,
          'Close',
          { duration: 3000 }
        );

        this.loadAllUsers();

        if (this.selectedUser?.id === userId) {
          this.selectedUser = this.convertDTOToUser(updatedUserDTO);
          this.selectedUserCurrentRole = updatedUserDTO.role;
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
    return user.role === Role.MASTERADMIN;
  }
  openDeleteConfirmation(): void {
    console.log('Opening account deletion confirmation dialog');
    const dialogRef = this.dialog.open(this.deleteConfirmationDialog, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Dialog closed with result:', result);
      if (result === true) {
        this.deleteAccount();
      } else {
        console.log('Deletion cancelled');
      }
    });
  }

 deleteAccount(): void {
    console.log('Deleting user account');

    if (!this.currentUser) {
        console.error('No current user available');
        this.snackBar.open('User data not available. Please refresh and try again.', 'Close', { duration: 3000 });
        return;
    }

    let accountId = this.currentUser.accountId;

    if (!accountId) {
        console.warn('No accountId found in currentUser, trying to use user ID instead');
        accountId = this.currentUser.id;

        if (!accountId) {
            console.error('Missing both accountId and userId, cannot delete account');
            this.snackBar.open('User account ID missing. Cannot delete account.', 'Close', { duration: 3000 });
            return;
        }
    }

    console.log('About to delete account with ID:', accountId);

    this.isUpdating = true;
    this.formState = 'loading';

    console.log('Calling accountService.deleteAccount()');

    this.accountService.deleteAccount(accountId)
        .pipe(
            tap(() => console.log('Delete request successful')),
            catchError((error) => {
                console.error('Error while deleting account:', error);
                this.snackBar.open('Failed to delete account: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
                return throwError(() => error);
            }),
            finalize(() => {
                console.log('Delete request finalized');
                this.isLoading = false;
                this.isUpdating = false;
                this.formState = 'default';
            })
        )
        .subscribe({
            next: async () => {
                console.log('Account deleted successfully, now updating accountLocked to true');

                if (this.currentUser?.id) {
                  const updatedUser: User = {
                    ...this.currentUser,
                    accountLocked: true
                  };

                  try {
                    await firstValueFrom(this.userService.updateUser(this.currentUser.id, this.convertUserToDTO(updatedUser)));
                    console.log('accountLocked updated to true');
                  } catch (updateError) {
                    console.error('Failed to update accountLocked:', updateError);
                  }
                }

                this.snackBar.open('Account successfully deleted', 'Close', { duration: 3000 });

                setTimeout(() => {
                  console.log('Logging out...');
                  this.authService.logout();
                }, 1500);
              },

            error: (error) => {
                console.error('Delete account error in subscribe:', error);
            },
            complete: () => {
                console.log('Delete account subscription completed');
            }
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

  private convertUserToDTO(user: User): UserDTO {
    const email = this.profileForm.get('email')?.value ||
                  (user.accountId ? this.emailCache.get(user.accountId) : '');

    return {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      photoProfile: user.photoProfile,
      creationDate: user.creationDate,
      modifiedAt: user.modifiedAt,
      email: email,
      account: user.accountId ? {
        id: user.accountId,
        email: email
      } : undefined,
      accountLocked: user.accountLocked || false,
      enabled: user.enabled || true
    };
  }
search(): void {
    console.log('Searching users with criteria:', this.userManagementForm.value);
    this.isLoadingUsers = true;

    const name = this.userManagementForm.get('name')?.value || '';
    const email = this.userManagementForm.get('email')?.value || '';
    const role = this.userManagementForm.get('role')?.value || undefined;

    this.userService.searchUsers(name, email, role as Role)
      .pipe(
        finalize(() => {
          this.isLoadingUsers = false;
        })
      )
      .subscribe({
        next: (users: UserDTO[]) => {
          console.log('Search results:', users);
          this.users = users.map(userDTO => this.convertDTOToUser(userDTO));
          this.dataSource.data = this.users;

          this.prefetchEmails(this.users);
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.snackBar.open(
            `Error searching users: ${error.message || 'Unknown error'}`,
            'Close',
            { duration: 3000 }
          );
        }
      });
  }

  resetSearch(): void {
    console.log('Resetting search form');
    this.userManagementForm.reset();
    this.loadAllUsers();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    console.log('Applying filter:', filterValue);

    if (this.dataSource) {
      this.dataSource.filter = filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;

  changePage(page: number): void {
    console.log('Changing to page:', page);
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    if (this.filteredUsers.length > 0) {
      const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);
      this.dataSource.data = paginatedUsers;
    }

    this.calculateTotalPages();
  }

  private calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
  }
getEmailForUser(user: User): string {
    if (!user || !user.accountId) return 'Email not available';

    if (this.emailCache.has(user.accountId)) {
      return this.emailCache.get(user.accountId) || '';
    }
    this.fetchAndSetEmail(user.accountId);
    return 'Loading...';
  }

  viewUserDetails(user: User): void {
    console.log('Viewing user details:', user);
    this.selectedUser = user;

    if (user.accountId && !this.emailCache.has(user.accountId)) {
      this.fetchAndSetEmail(user.accountId);
    }

    this.activeCardIndex = 3;
  }

  private fetchAndSetEmail(accountId: string): void {
    this.accountService.getAccountById(accountId).subscribe({
      next: (account) => {
        if (account && account.email) {
          this.emailCache.set(accountId, account.email);

          if (this.selectedUser && this.selectedUser.accountId === accountId) {
            setTimeout(() => {}, 0);
          }
        }
      },
      error: (error) => {
        console.error(`Error fetching email for account ${accountId}:`, error);
        this.emailCache.set(accountId, 'Email unavailable');
      }
    });
  }


  updatePreferences(): void {
      if (this.preferencesForm.invalid || !this.currentUser?.id) {
        this.snackBar.open('Please fill in all required fields correctly.', 'Close', { duration: 3000 });
        return;
      }

      this.isUpdating = true;
      this.formState = 'loading';

      const preferences = this.preferencesArray.value;

      const updates: Observable<PreferenceDTO>[] = [];

      preferences.forEach(pref => {
        if (pref.id) {
          updates.push(this.preferenceService.updatePreference(pref.id, pref));
        } else {
          pref.userId = this.currentUser!.id;
          updates.push(this.preferenceService.createPreference(pref));
        }
      });

      if (updates.length > 0) {
        import('rxjs').then(({forkJoin}) => {
          forkJoin(updates).pipe(
            finalize(() => {
              this.isUpdating = false;
              this.formState = 'default';
            })
          ).subscribe({
            next: (updatedPrefs) => {
              console.log('Preferences updated successfully:', updatedPrefs);
              this.snackBar.open('Preferences updated successfully', 'Close', { duration: 3000 });
              this.loadPreferences(this.currentUser!.id!);
            },
            error: (error) => {
              console.error('Error updating preferences:', error);
              this.snackBar.open(
                `Error updating preferences: ${error.message || 'Unknown error'}`,
                'Close',
                { duration: 3000 }
              );
            }
          });
        });
      } else {
        this.isUpdating = false;
        this.formState = 'default';
        this.snackBar.open('No preferences to update', 'Close', { duration: 3000 });
      }
    }


    removePreferenceField(index: number): void {
      console.log('Removing preference field at index:', index);

      this.formState = 'loading';

      setTimeout(() => {
        const preference = this.preferencesArray.at(index);
        const preferenceId = preference.get('id')?.value;

        if (preferenceId) {
          this.preferenceService.deletePreference(preferenceId).subscribe({
            next: () => {
              console.log('Preference deleted on server successfully');
              this.snackBar.open('Preference deleted', 'Close', { duration: 2000 });
            },
            error: (error) => {
              console.error('Error deleting preference:', error);
              this.snackBar.open('Error deleting preference', 'Close', { duration: 3000 });
            }
          });
        }

        this.preferencesArray.removeAt(index);

        if (this.preferencesArray.length === 0) {
          this.addPreferenceField();
        }

        console.log('Preference fields count after removal:', this.preferencesArray.length);

        setTimeout(() => {
          this.formState = 'default';
        }, 100);
      }, 200);
    }
    addPreferenceField(): void {
      this.preferencesArray.push(this.createPreferenceFormGroup());
    }

    createPreferenceFormGroup(): UntypedFormGroup {
        return this.fb.group({
          id: [''],
          category: ['', [Validators.required]],
          priority: ['', [Validators.required]],
          userId: [this.currentUser?.id || '']
        });
      }
      onCategoryChange(index: number): void {
        const control = this.preferencesArray.at(index).get('category');
        const selectedCategory = control?.value;

        if (this.isCategoryAlreadySelected(selectedCategory, index)) {
          // Marquer le contrôle comme invalide avec une erreur personnalisée
          control?.setErrors({ duplicateCategory: true });

          // Optionnel: afficher un message à l'utilisateur
          this.snackBar.open('Cette catégorie est déjà sélectionnée', 'Fermer', { duration: 3000 });
        } else {
          // Si la catégorie était précédemment marquée comme dupliquée, effacer cette erreur
          const errors = control?.errors;
          if (errors) {
            delete errors.duplicateCategory;
            control?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
      }
      // Ajoutez cette propriété à votre classe MasterAdminProfileComponent
availableCategories = [
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
getAdminCount(): number {
    if (!this.users || this.users.length === 0) {
      return 0;
    }

    return this.users.filter(user =>
      user.role === Role.ADMIN || user.role === Role.MASTERADMIN
    ).length;
  }

  getTravelerCount(): number {
    if (!this.users || this.users.length === 0) {
      return 0;
    }

    return this.users.filter(user =>
      user.role === Role.TRAVELER
    ).length;
  }

  getActiveUserCount(): number {
    if (!this.users || this.users.length === 0) {
      return 0;
    }

    return this.users.filter(user =>
      user.enabled === true
    ).length;
  }


  toggleEnabled(user: User): void {
    const updatedUser = { ...user, enabled: !user.enabled };
    this.isUpdating = true;

    this.userService.updateUser(user.id!, this.convertUserToDTO(updatedUser)).subscribe({
      next: () => {
        this.snackBar.open(`User ${updatedUser.enabled ? 'enabled' : 'disabled'}`, 'Close', { duration: 3000 });
        this.loadAllUsers();
      },
      error: (error) => {
        console.error('Error toggling enabled status:', error);
        this.snackBar.open('Failed to update user status', 'Close', { duration: 3000 });
      },
      complete: () => this.isUpdating = false
    });
  }

  toggleAccountLock(user: User): void {
    const updatedUser = { ...user, accountLocked: !user.accountLocked };
    this.isUpdating = true;

    this.userService.updateUser(user.id!, this.convertUserToDTO(updatedUser)).subscribe({
      next: () => {
        this.snackBar.open(`User account ${updatedUser.accountLocked ? 'locked' : 'unlocked'}`, 'Close', { duration: 3000 });
        this.loadAllUsers();
      },
      error: (error) => {
        console.error('Error toggling account lock:', error);
        this.snackBar.open('Failed to update account lock status', 'Close', { duration: 3000 });
      },
      complete: () => this.isUpdating = false
    });
  }
  getUnlockedUserCount(): number {
    if (!this.users || this.users.length === 0) {
      return 0;
    }

    return this.users.filter(user =>
      !user.accountLocked
    ).length;
  }
}
