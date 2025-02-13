
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { PersonnelService } from 'app/modules/projects/services/personnel.service';
import { Personnel, Projet } from 'app/modules/projects/projet.model';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit {
  projectForm: FormGroup;
  personnels: Personnel[] = [];

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private personnelService: PersonnelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      dateDebut: [null, Validators.required],
      dateLimite: [null, Validators.required],
      status: ['', Validators.required],
      personnels: [[], Validators.required] 
    });

    this.personnelService.getAllPersonnel().subscribe(
      (data: Personnel[]) => this.personnels = data,
      error => console.error('Error loading personnels', error)
    );
  }

  onSubmit(): void {
    if (this.projectForm.valid) {
      const projet: Projet = {
        ...this.projectForm.value,
        personnelIds: this.projectForm.value.personnels
      };

      this.projectService.createProjet(projet).subscribe(
        () => {
          this.router.navigate(['/projects/project-list']);
        },
        error => {
          console.error('Error while adding the project:', error);
        }
      );
    }
  }

  onCancel(): void {
    this.router.navigate(['/projects/project-list']);
  }
}
