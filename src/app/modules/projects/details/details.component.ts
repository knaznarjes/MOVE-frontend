import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ProjectService } from '../services/project.service';
import { VersionProjet, Projet } from '../projet.model';
import { AddTaskModalComponent } from 'app/modules/projects/details/task/add-task-modal/add-task-modal.component';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  projetForm: UntypedFormGroup;
  showTemplate: 'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion' = 'projectDetail';
  selectedVersion: VersionProjet | null = null;
  errorMessage: string | null = null;
  project: Projet | null = null;
  id: string | null = null;

  constructor(
    private fb: UntypedFormBuilder,
    private projetService: ProjectService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      if (this.id) {
        this.loadProject(this.id);
      }
    });

    this.initForm();
  }

  initForm(): void {
    this.projetForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      dateDebut: ['', Validators.required],
      dateLimite: ['', Validators.required],
      versions: this.fb.array([])
    });
  }

  loadProject(id: string): void {
    this.projetService.getProjetById(id).subscribe({
      next: (data: Projet) => {
        this.project = data;
        this.setFormData(data);
      },
      error: (err) => this.errorMessage = 'Failed to load project: ' + err
    });
  }

  setFormData(data: Projet): void {
    this.projetForm.patchValue({
      nom: data.nom,
      description: data.description,
      dateDebut: this.formatDate(data.dateDebut),
      dateLimite: this.formatDate(data.dateLimite)
    });

    const versions = this.projetForm.get('versions') as UntypedFormArray;
    versions.clear();

    data.versionIds?.forEach(versionId => {
      this.projetService.getVersionById(versionId).subscribe({
        next: (version: VersionProjet) => {
          const versionGroup = this.fb.group({
            numeroVersion: [version.numeroVersion || ''],
            dateDebut: [this.formatDate(version.dateDebut)],
            dateFin: [this.formatDate(version.dateFin)],
            technologies: [version.technologies || []],
            taches: this.fb.array((version.tacheIds || []).map((taskId: string) => this.fb.group({
              description: [''],
              dateDebut: [''],
              dateFin: [''],
              status: [''],
              personnelIds: [[]]
            })))
          });

          versions.push(versionGroup);
        },
        error: (err) => this.errorMessage = 'Failed to load version: ' + err
      });
    });
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  get versions(): UntypedFormArray {
    return this.projetForm.get('versions') as UntypedFormArray;
  }

  saveProject(): void {
    if (this.projetForm.valid) {
      const updatedProject: Projet = this.projetForm.value;
      this.projetService.updateProjet(this.id || '', updatedProject).subscribe({
        next: () => this.router.navigate(['/projects']),
        error: (err) => this.errorMessage = 'Failed to save project: ' + err
      });
    }
  }

  openAddTaskModal(versionId: string): void {
    const dialogRef = this.dialog.open(AddTaskModalComponent, {
      width: '400px',
      data: { versionId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      }
    });
  }

  onVersionSelected(versionId: string): void {
    this.projetService.getVersionById(versionId).subscribe({
      next: (version: VersionProjet) => {
        this.selectedVersion = version;
        this.showTemplate = 'versionDetail';
      },
      error: (err) => this.errorMessage = 'Failed to load version: ' + err
    });
  }

  setTemplateName(templateName: 'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion'): void {
    this.showTemplate = templateName;
  }

  navigateToAddVersion(): void {
    if (this.id) {
      this.router.navigate(['/projects', 'details', this.id, 'versions']);
    } else {
      console.error('Project ID is not available');
    }
  }

}
