import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PersonnelService } from 'app/modules/developers/developers.service';
import { Personnel } from 'app/modules/developers/developers.model';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-add-developer-dialog',
  templateUrl: './add-developer-dialog.component.html',
  styleUrls: ['./add-developer-dialog.component.scss']
})
export class AddDeveloperDialogComponent implements OnInit {
  developerForm: FormGroup;
  availableSkills: string[] = [
    'Angular',
    'SpringBoot',
    'Flutter',
    'TypeScript',
    'Laravel',
    'React',
    'Java',
    'Python',
    'AWS',
    'Node.js'
  ];

  availableRoles: string[] = [
    'Senior Developer',
    'Project Manager',
    'Backend Developer',
    'Frontend Developer'
  ];

  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredSkills: Observable<string[]>;
  selectedSkills: string[] = [];

  @ViewChild('skillInput') skillInput: ElementRef<HTMLInputElement>;

  skillCtrl = new FormControl('');

  constructor(
    private dialogRef: MatDialogRef<AddDeveloperDialogComponent>,
    private fb: FormBuilder,
    private personnelService: PersonnelService
  ) {
    this.developerForm = this.fb.group({
      nom: ['', Validators.required],
      competences: [[], Validators.required],
      disponibilite: [true],
      role: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.filteredSkills = this.skillCtrl.valueChanges.pipe(
      startWith(null),
      map((skill: string | null) => skill ? this._filter(skill) : this.availableSkills.slice()),
    );
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.addSkill(value);
    }
    event.chipInput!.clear();
    this.skillCtrl.setValue(null);
  }

  remove(skill: string): void {
    const index = this.selectedSkills.indexOf(skill);
    if (index >= 0) {
      this.selectedSkills.splice(index, 1);
      this.updateCompetences();
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addSkill(event.option.viewValue);
    this.skillInput.nativeElement.value = '';
    this.skillCtrl.setValue(null);
  }

  private addSkill(skill: string): void {
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
      const newDeveloper: Personnel = {
        ...this.developerForm.value,
        competences: this.selectedSkills
      };
      this.personnelService.createPersonnel(newDeveloper).subscribe(
        (createdDeveloper) => {
          this.dialogRef.close(createdDeveloper);
        },
        (error) => {
          console.error('Error creating developer:', error);
        }
      );
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
