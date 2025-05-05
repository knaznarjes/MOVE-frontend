import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VersionProjet } from '../projet.model';
import { ProjectService } from '../services/project.service';

@Component({
  selector: 'app-add-version',
  templateUrl: './add-version.component.html',
  styleUrls: ['./add-version.component.scss']
})
export class AddVersionComponent implements OnInit {
  versionForm: UntypedFormGroup;
  projectId: string | null = null;
  technologies: string[] = [];
  nextVersionNumber: string = '';

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('id');
      if (!this.projectId) {
        console.error('No project ID provided');
        this.router.navigate(['/projects']);
        return;
      }

      this.initForm();
      this.loadTechnologies();
      this.getNextVersionNumber();
    });
  }

  private initForm(): void {
    this.versionForm = this.fb.group({
      numeroVersion: ['', Validators.required],
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required],
      technologies: [[], Validators.required]
    });
  }

  loadTechnologies(): void {
    this.technologies = [
      'Angular',
      'React',
      'Vue',
      'Node.js',
      'Java',
      'Python'
    ];
  }

  getNextVersionNumber(): void {
    if (!this.projectId) return;

    this.projectService.getVersionsByProjetId(this.projectId).subscribe(
      (versions: VersionProjet[]) => {
        let nextVersionNumber = 'V00';
        if (versions.length > 0) {
          const latestVersion = versions.reduce((max, v) =>
            (v.numeroVersion && max && v.numeroVersion > max) ? v.numeroVersion : max, 'V000');
          nextVersionNumber = this.incrementVersion(latestVersion);
        }
        this.versionForm.get('numeroVersion')?.setValue(nextVersionNumber);
      },
      error => {
        console.error('Error loading versions:', error);
        // Handle error (e.g., show error message to user)
      }
    );
  }

  onSubmit(): void {
    if (this.versionForm.valid && this.projectId) {
      const versionData: VersionProjet = {
        numeroVersion: this.versionForm.get('numeroVersion')?.value,
        dateDebut: this.versionForm.get('dateDebut')?.value,
        dateFin: this.versionForm.get('dateFin')?.value,
        projetId: this.projectId,
        technologies: this.versionForm.get('technologies')?.value
      };
      this.projectService.createVersionForProjet(this.projectId, versionData).subscribe({
        next: () => {
          // Naviguez vers la vue des détails du projet
          this.router.navigate(['/projects', 'details', this.projectId], {
            queryParams: { template: 'projectDetail' }
          });
          // Update the next version number for the next submission
          this.getNextVersionNumber();
        },
        error: (err) => {
          console.error('Failed to create version: ', err);
        }
      });
    }
  }

  incrementVersion(version: string): string {
    const match = version.match(/^V(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      return `V${num.toString().padStart(3, '0')}`;
    }
    return 'V001';
  }

  onCancel(): void {
    if (this.projectId) {
      this.router.navigate([`/projects/${this.projectId}/details`]);
    } else {
      this.router.navigate(['/projects']);
    }
  }
}
