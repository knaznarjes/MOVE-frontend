import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Personnel } from 'app/modules/developers/developers.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-edit-developer-dialog',
  templateUrl: './edit-developer-dialog.component.html',
  styleUrls: ['./edit-developer-dialog.component.scss']
})
export class EditDeveloperDialogComponent implements OnInit {
  developerForm: FormGroup;
  availableSkills: string[] = ['Angular', 'SpringBoot', 'Flutter', 'TypeScript', 'Laravel', 'React'];
  availableRoles: string[] = ['Senior Developer',
    'Project Manager',
    'Backend Developer',
    'Frontend Developer'];

  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredSkills: Observable<string[]>;
  selectedSkills: string[] = [];

  @ViewChild('skillInput') skillInput: ElementRef<HTMLInputElement>;

  skillCtrl = new FormControl('');

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditDeveloperDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Personnel
  ) {
    this.developerForm = this.fb.group({
      nom: [data.nom, Validators.required],
      competences: [[], Validators.required],
      disponibilite: [data.disponibilite],
      role: [data.role, Validators.required]
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.filteredSkills = this.skillCtrl.valueChanges.pipe(
      startWith(''),
      map((skill: string | null) => skill ? this._filter(skill) : this.availableSkills.slice())
    );
  }

  initializeForm() {
    if (this.data.competences) {
      this.selectedSkills = this.data.competences;
      this.developerForm.patchValue({
        competences: this.selectedSkills
      });
    }
  }

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.addSkillToList(value);
    }
    event.chipInput!.clear();
    this.skillCtrl.setValue(null);
  }

  removeSkill(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index >= 0) {
      this.selectedSkills.splice(index, 1);
      this.updateCompetences();
    }
  }

  addSkillOption(event: MatAutocompleteSelectedEvent): void {
    this.addSkillToList(event.option.viewValue);
    this.skillInput.nativeElement.value = '';
    this.skillCtrl.setValue(null);
  }

  private addSkillToList(skill: string): void {
    if (!this.selectedSkills.includes(skill)) {
      this.selectedSkills.push(skill);
      this.updateCompetences();
    }
  }

  private updateCompetences(): void {
    this.developerForm.patchValue({ competences: this.selectedSkills });
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.availableSkills.filter(skill => skill.toLowerCase().includes(filterValue));
  }

  onSubmit(): void {
    if (this.developerForm.valid) {
      const updatedPersonnel: Personnel = {
        ...this.data,
        ...this.developerForm.value,
        competences: this.selectedSkills
      };
      console.log('Updated Personnel:', updatedPersonnel);
      this.dialogRef.close(updatedPersonnel);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  add(event: MatChipInputEvent): void {
    this.addSkill(event);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addSkillOption(event);
  }
}
