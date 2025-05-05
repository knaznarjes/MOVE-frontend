import { Component, Input, OnChanges, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { Projet, VersionProjet, Personnel } from 'app/modules/projects/projet.model';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { VersionProjetService } from 'app/modules/projects/services/version-projet.service'; // Import the new service
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ConfirmDialogComponent } from 'app/modules/projects/confirm-dialog/confirm-dialog.component';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnChanges {
  @Input() project: Projet | null = null;
  @Output() versionSelected = new EventEmitter<string>();

  developers: Personnel[] = [];
  versions: VersionProjet[] = [];
  selectedVersion: VersionProjet | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private projectService: ProjectService,
    private versionService: VersionProjetService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProjectData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['project'] && !changes['project'].firstChange) {
      this.loadProjectData();
    }
  }

  loadProjectData(): void {
    if (this.project) {
      this.isLoading = true;
      this.error = null;
      this.loadDevelopers();
      this.loadVersions();
    } else {
      this.developers = [];
      this.versions = [];
      this.isLoading = false;
    }
  }

  loadDevelopers(): void {
    if (this.project?.id) {
      this.projectService.getPersonnelsByProjetId(this.project.id).pipe(
        catchError(error => {
          console.error('Error loading developers', error);
          this.error = 'Unable to load developers.';
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      ).subscribe(
        (developers: Personnel[]) => {
          this.developers = developers;
        }
      );
    } else {
      this.developers = [];
    }
  }

  loadVersions(): void {
    if (this.project?.id) {
      this.projectService.getVersionsByProjetId(this.project.id).pipe(
        finalize(() => this.isLoading = false)
      ).subscribe(
        (versions: VersionProjet[]) => {
          this.versions = versions;
        }
      );
    } else {
      this.versions = [];
    }
  }

  onSelectVersion(version: VersionProjet): void {
    this.selectedVersion = version;
    this.versionSelected.emit(version.id);
  }
}
