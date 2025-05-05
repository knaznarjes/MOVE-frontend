/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable arrow-parens */
/* eslint-disable curly */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { PreferenceService } from '../../services/preference.service';
import { UserService } from '../../services/user.service';
import { User, Preference, Role, UserDTO, AccountDTO, Account, PreferenceDTO } from '../../models/models';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { of, firstValueFrom, Observable, throwError } from 'rxjs';
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
      ]),
      // Add the missing formAnimation trigger
      trigger('formAnimation', [
        state('default', style({ opacity: 1 })),
        state('loading', style({ opacity: 0.7 })),
        transition('default <=> loading', animate('200ms ease-in-out'))
      ])
    ]
  })
export class TravelerProfileComponent implements OnInit {
  profileForm: UntypedFormGroup;
  preferencesForm: UntypedFormGroup;
  passwordForm: UntypedFormGroup;
  isLoading = true;
  isUpdating = false;
  currentUser: User | null = null;
  userEmail: string = '';
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
  private emailCache: Map<string, string> = new Map();
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

  passwordMatchValidator(group: UntypedFormGroup) {
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
 private fetchAndSetEmail(accountId: string): void {
    this.accountService.getAccountById(accountId).subscribe({
      next: (account) => {
        if (account && account.email) {
          this.emailCache.set(accountId, account.email);
          this.profileForm.patchValue({
            email: account.email
          });
        }
      },
      error: (error) => {
        console.error('Error fetching email for account:', error);
      }
    });
  }


  isUserDTO(userData: any): userData is UserDTO {
    return userData && (userData.role !== undefined || userData.account !== undefined);
  }

  isAccountDTO(userData: any): userData is AccountDTO {
    return userData && userData.email !== undefined && userData.role === undefined;
  }

  fetchEmailFromAccount(accountId: string): void {
    this.accountService.getAccountById(accountId).pipe(
      map(account => {
        if (account && typeof account === 'object' && 'email' in account) {
          return account.email;
        }
        return '';
      }),
      catchError(error => {
        console.error('Error fetching email:', error);
        return of('');
      })
    ).subscribe(email => {
      this.userEmail = email;
      this.profileForm.patchValue({ email: this.userEmail });
    });
  }

  adaptUserResponse(userData: any): User {
    if (!userData) return null as any;
    return {
      id: userData.id,
      fullName: userData.fullName || '',
      role: userData.role || Role.TRAVELER,
      photoProfile: userData.photoProfile || null,
      accountId: this.isUserDTO(userData) && userData.account ? userData.account.id : userData.accountId,
      preferences: userData.preferences || [],
      creationDate: userData.creationDate,
      modifiedAt: userData.modifiedAt,
      accountLocked: userData.accountLocked,
      enabled: userData.enabled
    };
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
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
    });
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

  get preferencesArray(): UntypedFormArray {
    return this.preferencesForm.get('preferences') as UntypedFormArray;
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
    loadAllUsers() {
        throw new Error('Method not implemented.');
    }

}
