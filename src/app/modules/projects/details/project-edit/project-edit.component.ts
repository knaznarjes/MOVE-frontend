import { Component, Input, Output, EventEmitter, OnChanges, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Projet, Personnel } from 'app/modules/projects/projet.model';
import { PersonnelService } from 'app/modules/projects/services/personnel.service';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
  styleUrls: ['./project-edit.component.scss']
})
export class ProjectEditComponent implements OnInit, OnChanges, OnDestroy {
  @Input() project: Projet | null = null;
  @Output() templateName = new EventEmitter<'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion'>();
  projectForm: FormGroup;
  personnels: Personnel[] = [];
  projectId: string | null = null;
  private routeSub: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private personnelService: PersonnelService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      dateDebut: [null, Validators.required],
      dateLimite: [null, Validators.required],
      status: ['', Validators.required],
      personnelIds: [[], Validators.required],
      versionIds: [''],
    });

    // Charger les personnels
    this.personnelService.getAllPersonnel().subscribe(
      (data: Personnel[]) => this.personnels = data,
      error => console.error('Error loading personnels', error)
    );

    // Charger l'ID du projet depuis les paramètres de la route
    this.routeSub.add(
      this.route.params.subscribe(params => {
        this.projectId = params['id'];
        if (this.projectId) {
          this.loadProject(this.projectId);
        }
      })
    );
  }

  ngOnChanges(): void {
    if (this.project && this.projectForm) {
      this.projectForm.patchValue({
        nom: this.project.nom,
        description: this.project.description,
        dateDebut: this.project.dateDebut ? new Date(this.project.dateDebut) : null,
        dateLimite: this.project.dateLimite ? new Date(this.project.dateLimite) : null,
        status: this.project.status,
        personnelIds: this.project.personnelIds || [],
        versionIds: this.project.versionIds || []
      });
    }
  }

  onSubmit(): void {
    if (this.projectForm.valid && this.projectId) {
      this.projectForm.value.versionIds = this.project.versionIds;
      this.projectService.updateProjet(this.projectId, this.projectForm.value).subscribe({
        next: () => {
            this.templateName.emit('projectDetail');
        },
        error: (error)=> {
            console.error('Error while updating the project:', error);
          }
      }
      );
    }
  }

  ngOnDestroy(): void {
    this.routeSub.unsubscribe();
  }

  private loadProject(projectId: string): void {
    this.projectService.getProjetById(projectId).subscribe(
      (project: Projet) => {
        this.projectForm.patchValue({
          nom: project.nom,
          description: project.description,
          dateDebut: project.dateDebut ? new Date(project.dateDebut) : null,
          dateLimite: project.dateLimite ? new Date(project.dateLimite) : null,
          status: project.status,
          personnelIds: project.personnelIds || []  // Assurez-vous que personnelIds est un tableau
        });
      },
      error => console.error('Error loading project', error)
    );
  }



  onCancel(): void {
    this.router.navigate(['/projects/project-list']);
  }
}
