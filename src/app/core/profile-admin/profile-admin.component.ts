
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProfileService } from '../services/profile.service';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../models/user.models';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-profile-admin',
  templateUrl: './profile-admin.component.html',
  styleUrls: ['./profile-admin.component.scss']
})
export class ProfileAdminComponent implements OnInit, OnDestroy {
  users: User[] = [];
  dashboardMetrics: any;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private profileService: ProfileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    // Load users
    this.profileService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load users';
          this.isLoading = false;
          this.showError('Error loading users');
        }
      });

    // Load dashboard metrics
    this.profileService.getAdminDashboardMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: metrics => this.dashboardMetrics = metrics,
        error: () => this.showError('Error loading dashboard metrics')
      });
  }

  updateUserRole(userId: string, newRole: 'USER' | 'ADMIN'): void {
    this.profileService.updateUserRole(userId, newRole)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === userId);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.showSuccess('User role updated successfully');
        },
        error: () => this.showError('Error updating user role')
      });
  }

  deleteUser(userId: string, userName: string): void {
    if (confirm(`Are you sure you want to delete ${userName}?`)) {
      this.profileService.deleteUser(userId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== userId);
            this.showSuccess('User deleted successfully');
          },
          error: () => this.showError('Error deleting user')
        });
    }
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
