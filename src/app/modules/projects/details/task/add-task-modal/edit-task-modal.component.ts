import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { PersonnelService } from 'app/modules/projects/services/personnel.service';
import { Tache, Personnel } from 'app/modules/projects/projet.model';
import { TacheService } from 'app/modules/projects/services/tache.service';

@Component({
  selector: 'app-edit-task-modal',
  templateUrl: './edit-task-modal.component.html',
})
export class EditTaskModalComponent implements OnInit {
  taskForm: FormGroup;
  allDevelopers: Personnel[] = [];
  displayedDevelopers: Personnel[] = [];
  statuses: string[] = ['Not Started', 'In Progress', 'Completed'];

  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private personnelService: PersonnelService,
    private tacheService: TacheService,
    public dialogRef: MatDialogRef<EditTaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Tache, projetId: string }
  ) {
    this.taskForm = this.fb.group({
      description: [this.data.task.description, Validators.required],
      startDate: [this.data.task.dateDebut, Validators.required],
      endDate: [this.data.task.dateFin, Validators.required],
      status: [this.data.task.status, Validators.required],
      personnelIds: [this.data.task.personnelIds || [], Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data.projetId) {
      this.loadPersonnels(this.data.projetId);
    } else {
      console.error('ID du projet non défini.');
    }
  }

  loadPersonnels(projetId: string): void {
    this.projectService.getPersonnelsByProjetId(projetId).subscribe({
      next: (data: Personnel[]) => {
        this.allDevelopers = data;
        this.displayedDevelopers = this.allDevelopers;

        // Ensure the task's personnel IDs are reflected in the form
        this.taskForm.patchValue({
          personnelIds: this.data.task.personnelIds || []
        });
      },
      error: (err) => {
        this.error = 'Error loading developers: ' + err.message;
      }
    });
  }

  onSave(): void {
    if (this.taskForm.valid) {
      const formValues = this.taskForm.value;

      const updatedTask: Tache = {
        id: this.data.task.id,
        description: formValues.description,
        dateDebut: formValues.startDate,
        dateFin: formValues.endDate,
        status: formValues.status,
        personnelIds: formValues.personnelIds
      };

      this.tacheService.updateTache(updatedTask).subscribe({
        next: (result) => {
          console.log('Tâche mise à jour avec succès:', result);
          this.dialogRef.close(result);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la tâche:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
