import { Component, EventEmitter, Input, Output, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { VersionProjet, Tache, Personnel } from 'app/modules/projects/projet.model';
import { AddTaskModalComponent } from 'app/modules/projects/details/task/add-task-modal/add-task-modal.component';
import { VersionEditComponent } from '../version-edit/version-edit.component';
import { TacheService } from 'app/modules/projects/services/tache.service';
import { VersionProjetService } from 'app/modules/projects/services/version-projet.service';
import { PersonnelService } from 'app/modules/projects/services/personnel.service';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { ConfirmDialogComponent } from 'app/modules/projects/confirm-dialog/confirm-dialog.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap, tap, finalize } from 'rxjs/operators';
import { EditTaskModalComponent } from '../task/add-task-modal/edit-task-modal.component';

@Component({
  selector: 'app-version-detail',
  templateUrl: './version-detail.component.html',
  styleUrls: ['./version-detail.component.scss']
})
export class VersionDetailComponent implements OnInit {
  @Input() selectedVersion: VersionProjet | null = null;
  @Output() templateName = new EventEmitter<'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion'>();

  @ViewChild('matDrawer') matDrawer: MatDrawer | undefined;

  tasks: Tache[] = [];
  selectedTask: Tache | null = null;
  drawerOpened = false;

  isLoading = false;
  error: string | null = null;

  developers: Personnel[] = [];
  developersMap: Map<string, Personnel> = new Map();

  constructor(
    private dialog: MatDialog,
    private tacheService: TacheService,
    private versionProjetService: VersionProjetService,
    private personnelService: PersonnelService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    if (this.selectedVersion) {
      this.loadTasksAndDevelopers();
    }
  }

  loadTasksAndDevelopers(): void {
    if (this.selectedVersion?.tacheIds?.length) {
      this.isLoading = true;
      const taskObservables = this.selectedVersion.tacheIds.map(id => this.tacheService.getTacheById(id));

      forkJoin(taskObservables).pipe(
        catchError(error => {
          this.error = 'Error loading tasks: ' + error.message;
          return of([]);
        }),
        tap((tasks: Tache[]) => {
          this.tasks = tasks.filter(task => task != null);
          this.loadPersonnel();
        }),
        finalize(() => {
          this.isLoading = false;
        })
      ).subscribe();
    }
  }

  loadPersonnel(query: string = ''): void {
    this.personnelService.getAllPersonnel().subscribe({
        next: (data: Personnel[]) => {
        this.developers = data;
        this.developersMap = new Map<string, Personnel>(
          data.map(personnel => [personnel.id!, personnel])
        );
      },
      error: (err) => {
        this.error = 'Error loading developers: ' + err.message;
      }
    });
  }

  getDeveloperNames(id?: string): string {
    const record = this.developersMap.get(id);
    return record ? record.nom : id || 'Unknown';
  }

  getTaskDescription(taskId: string): string {
    const task = this.tasks.find(t => t.id === taskId);
    return task ? task.description || 'Unknown Task' : 'Unknown Task';
  }

  onTaskSelect(taskId: string): void {
    this.selectedTask = this.tasks.find(t => t.id === taskId) || null;
    if (this.selectedTask) {
      this.loadPersonnel();
      this.drawerOpened = true;
      this.matDrawer?.open();
    }
  }

  clearSelectedTask(): void {
    this.selectedTask = null;
    this.drawerOpened = false;
    this.matDrawer?.close();
  }

  editTask(): void {
    if (this.selectedTask) {
      const dialogRef = this.dialog.open(EditTaskModalComponent, {
        data: {
          task: this.selectedTask,
          projetId: this.selectedVersion?.projetId || ''
        },
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          const index = this.tasks.findIndex(t => t.id === result.id);
          if (index !== -1) {
            this.tasks[index] = result;
            this.selectedTask = result;
          }
          this.loadTasksAndDevelopers();
        }
      });
    }
  }


  deleteTask(): void {
    if (this.selectedTask && this.selectedVersion) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { message: 'Are you sure you want to delete this task?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isLoading = true;
          this.tacheService.deleteTacheFromVersion(this.selectedVersion.id!, this.selectedTask.id!).subscribe(
            () => {
              this.tasks = this.tasks.filter(t => t.id !== this.selectedTask?.id);
              this.selectedVersion.tacheIds = this.selectedVersion.tacheIds?.filter(id => id !== this.selectedTask?.id);
              this.clearSelectedTask();
              this.loadTasksAndDevelopers();
            },
            error => {
              this.error = 'Error deleting task: ' + error.message;
              this.isLoading = false;
            }
          );
        }
      });
    }
  }

  openAddTaskModal(): void {
    if (this.selectedVersion?.id && this.selectedVersion.projetId) {
      const dialogRef = this.dialog.open(AddTaskModalComponent, {
        width: '500px',
        data: {
          versionId: this.selectedVersion.id,
          projetId: this.selectedVersion.projetId,
          personnel: this.developers
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.tacheService.createTache(result).subscribe(
            newTask => {
              if (newTask) {
                this.tasks.push(newTask);
                if (this.selectedVersion) {
                  this.selectedVersion.tacheIds = this.selectedVersion.tacheIds || [];
                  this.selectedVersion.tacheIds.push(newTask.id!);
                }
                this.loadTasksAndDevelopers();
              }
            },
            error => {
              this.error = 'Error creating task: ' + error.message;
            }
          );
        }
      });
    }
  }

  openEditVersionModal(): void {
    if (this.selectedVersion) {
      const dialogRef = this.dialog.open(VersionEditComponent, {
        width: '500px',
        data: { version: this.selectedVersion }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          if (this.selectedVersion.id) {
            this.versionProjetService.updateVersion(this.selectedVersion.id, result).subscribe(
              updatedVersion => {
                this.selectedVersion = updatedVersion;
                this.templateName.emit('projectDetail');
              },
              error => {
                this.error = 'Error updating version: ' + error.message;
              }
            );
          }
        }
      });
    }
  }

  deleteVersion(): void {
    if (this.selectedVersion) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { message: 'Are you sure you want to delete this version?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.isLoading = true;
          this.versionProjetService.deleteVersion(this.selectedVersion.id!).subscribe(
            () => {
              this.templateName.emit('projectDetail');
              this.selectedVersion = null;
              this.isLoading = false;
            },
            error => {
              this.isLoading = false;
              this.error = 'Error deleting version: ' + error.message;
            }
          );
        }
      });
    }
  }
}
