import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Projet } from 'app/modules/projects/projet.model';

@Component({
  selector: 'app-project-edit',
  templateUrl: './project-edit.component.html',
  styleUrls: ['./project-edit.component.scss']
})
export class ProjectEditComponent implements OnInit {

  @Input() project: Projet | null = null;
  @Output() templateName = new EventEmitter<'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion'>();
  @Output() save = new EventEmitter<Projet>();
  projetForm: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.projetForm = this.fb.group({
      nom: [this.project?.nom || '', Validators.required],
      dateDebut: [this.project?.dateDebut || '', Validators.required],
      dateLimite: [this.project?.dateLimite || '', Validators.required],
      description: [this.project?.description || ''],
      status: [this.project?.status || '', Validators.required]  // Ajout du champ status
    });
  }

  saveProject(): void {
    if (this.projetForm.valid) {
      this.save.emit(this.projetForm.value);
    }
  }

  setTemplateName(templateName: 'projectDetail' | 'editProject' | 'versionDetail' | 'editVersion'): void {
    this.templateName.emit(templateName);
  }
}
