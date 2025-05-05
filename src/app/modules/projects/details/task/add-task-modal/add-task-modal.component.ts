import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { PersonnelService } from 'app/modules/projects/services/personnel.service';
import { Tache, Personnel } from 'app/modules/projects/projet.model';

@Component({
  selector: 'app-add-task-modal',
  templateUrl: './add-task-modal.component.html',
  styleUrls: ['./add-task-modal.component.scss']
})
export class AddTaskModalComponent implements OnInit {
  taskForm: UntypedFormGroup;
  personnels: Personnel[] = [];
  statuses: string[] = ['Not Started', 'In Progress'];

  constructor(
    private fb: UntypedFormBuilder,
    private projectService: ProjectService,
    private personnelService: PersonnelService,
    public dialogRef: MatDialogRef<AddTaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { versionId: string, projetId: string }
  ) {
    this.taskForm = this.fb.group({
      description: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      status: ['', Validators.required],
      personnelIds: [[], Validators.required]
    });
  }

  ngOnInit(): void {
    console.log('Version ID:', this.data.versionId);
    console.log('Project ID:', this.data.projetId);
    this.loadPersonnels();
  }

  loadPersonnels(): void {
    if (!this.data.projetId) {
      console.error('Project ID is undefined');
      return;
    }

    this.projectService.getPersonnelsByProjetId(this.data.projetId).subscribe(personnels => {
      this.personnels = personnels;
    }, error => {
      console.error('Error loading personnels', error);
    });
  }

  onSave(): void {
    if (this.taskForm.valid) {
      const formValues = this.taskForm.value;

      const newTask: Tache = {
        description: formValues.description,
        dateDebut: formValues.dateDebut ? new Date(formValues.dateDebut) : undefined,
        dateFin: formValues.dateFin ? new Date(formValues.dateFin) : undefined,
        status: formValues.status,
        personnelIds: formValues.personnelIds,
        versionId: this.data.versionId
      };

      if (!this.data.versionId || !this.data.projetId) {
        console.error('Version ID or Project ID is undefined');
        return;
      }

      this.projectService.createTaskForVersionForProjet(this.data.projetId, this.data.versionId, newTask).subscribe({
        next: (result) => {
          console.log('Task added successfully', result);
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Error adding task', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
