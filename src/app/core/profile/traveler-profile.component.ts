// traveler-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';

import { UserService } from '../../core/services/user.service';
import { PreferenceService } from '../../core/services/preference.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Preference } from '../../core/models/models';

@Component({
  selector: 'app-traveler-profile',
  templateUrl: './traveler-profile.component.html',
  styleUrls: ['./traveler-profile.component.scss']
})
export class TravelerProfileComponent implements OnInit {
  user: User | null = null;
  preferences: Preference[] = [];
  profileForm: FormGroup;
  preferencesForm: FormGroup;
  isLoading = false;
  isUpdating = false;
  profileImageSrc: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;

  constructor(
    private userService: UserService,
    private preferenceService: PreferenceService,
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: [{ value: '', disabled: true }]
    });

    this.preferencesForm = this.fb.group({
      category: ['', Validators.required],
      priority: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const userId = this.authService.currentUserValue?.id;

    if (userId) {
      this.userService.getUserById(userId).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe({
        next: (user) => {
          this.user = user;
          this.profileForm.patchValue({
            fullName: user.fullName,
            email: user.email
          });

          if (user.photoProfile) {
            this.profileImageSrc = user.photoProfile;
          }

          this.loadUserPreferences(userId);
        },
        error: (error) => {
          this.snackBar.open('Erreur lors du chargement du profil: ' + error.message, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.isLoading = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 5000 });
      this.authService.logout();
    }
  }

  loadUserPreferences(userId: string): void {
    this.preferenceService.getUserPreferences(userId).subscribe({
      next: (preferences) => {
        this.preferences = preferences;

        // If user has preferences, populate the form with the first one
        if (preferences.length > 0) {
          this.preferencesForm.patchValue({
            category: preferences[0].category,
            priority: preferences[0].priority
          });
        }
      },
      error: (error) => {
        this.snackBar.open('Erreur lors du chargement des préférences: ' + error.message, 'Fermer', { duration: 5000 });
      }
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isUpdating = true;
    const userId = this.authService.currentUserValue?.id;

    if (userId && this.user) {
      const updatedUser: User = {
        ...this.user,
        fullName: this.profileForm.get('fullName')?.value
      };

      this.userService.updateUser(userId, updatedUser).pipe(
        finalize(() => this.isUpdating = false)
      ).subscribe({
        next: (result) => {
          this.user = result;
          this.authService.fetchCurrentUser(); // Refresh current user in AuthService
          this.snackBar.open('Profil mis à jour avec succès', 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la mise à jour du profil: ' + error.message, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.isUpdating = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 5000 });
    }
  }

  updatePreferences(): void {
    if (this.preferencesForm.invalid) {
      return;
    }

    this.isUpdating = true;
    const userId = this.authService.currentUserValue?.id;

    if (userId) {
      const preference: Preference = {
        userId,
        category: this.preferencesForm.get('category')?.value,
        priority: this.preferencesForm.get('priority')?.value
      };

      // If user already has preferences, update the first one
      if (this.preferences.length > 0 && this.preferences[0].id) {
        this.preferenceService.updatePreference(this.preferences[0].id, preference).pipe(
          finalize(() => this.isUpdating = false)
        ).subscribe({
          next: (result) => {
            this.preferences[0] = result;
            this.snackBar.open('Préférences mises à jour avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la mise à jour des préférences: ' + error.message, 'Fermer', { duration: 5000 });
          }
        });
      } else {
        // Otherwise create a new preference
        this.preferenceService.createPreference(preference).pipe(
          finalize(() => this.isUpdating = false)
        ).subscribe({
          next: (result) => {
            this.preferences.push(result);
            this.snackBar.open('Préférences créées avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open('Erreur lors de la création des préférences: ' + error.message, 'Fermer', { duration: 5000 });
          }
        });
      }
    } else {
      this.isUpdating = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 5000 });
    }
  }

  onFileSelected(event: Event): void {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      this.selectedFile = element.files[0];

      // Preview image
      const reader = new FileReader();
      // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      reader.onload = (e) => {
        this.profileImageSrc = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  uploadProfilePhoto(): void {
    if (!this.selectedFile) {
      return;
    }

    this.isUpdating = true;
    const userId = this.authService.currentUserValue?.id;

    if (userId) {
      this.userService.updateProfilePhoto(userId, this.selectedFile).pipe(
        finalize(() => this.isUpdating = false)
      ).subscribe({
        next: (result) => {
          this.user = result;
          this.profileImageSrc = result.photoProfile;
          this.selectedFile = null;
          this.authService.fetchCurrentUser(); // Refresh current user in AuthService
          this.snackBar.open('Photo de profil mise à jour avec succès', 'Fermer', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la mise à jour de la photo: ' + error.message, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.isUpdating = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 5000 });
    }
  }

  deleteAccount(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte? Cette action est irréversible.')) {
      return;
    }

    this.isUpdating = true;
    const userId = this.authService.currentUserValue?.id;

    if (userId) {
      this.userService.deleteUser(userId).pipe(
        finalize(() => this.isUpdating = false)
      ).subscribe({
        next: () => {
          this.snackBar.open('Compte supprimé avec succès', 'Fermer', { duration: 3000 });
          this.authService.logout();
        },
        error: (error) => {
          this.snackBar.open('Erreur lors de la suppression du compte: ' + error.message, 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.isUpdating = false;
      this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 5000 });
    }
  }
}
