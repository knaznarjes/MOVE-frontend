import { Component, Input, OnChanges, SimpleChanges, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VersionProjet } from 'app/modules/projects/projet.model';
import { VersionProjetService } from 'app/modules/projects/services/version-projet.service';

@Component({
  selector: 'app-version-edit',
  templateUrl: './version-edit.component.html',
  styleUrls: ['./version-edit.component.scss']
})
export class VersionEditComponent implements OnChanges {
  @Input() version: VersionProjet | null = null;

  versionForm: FormGroup;
  technologies: string[] = [];

  constructor(
    private fb: FormBuilder,
    private versionService: VersionProjetService,
    public dialogRef: MatDialogRef<VersionEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { version: VersionProjet }
  ) {
    this.versionForm = this.fb.group({
      numeroVersion: [{ value: '', disabled: true }],
      dateDebut: [null, Validators.required],
      dateFin: [null, Validators.required],
      technologies: [[], Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['version'] && this.version) {
      this.versionForm.patchValue({
        numeroVersion: this.version.numeroVersion,
        dateDebut: this.version.dateDebut ? new Date(this.version.dateDebut) : null,
        dateFin: this.version.dateFin ? new Date(this.version.dateFin) : null,
        technologies: this.version.technologies || []
      });
    }
  }

  ngOnInit(): void {
    this.loadTechnologies();
    if (this.data && this.data.version) {
      this.version = this.data.version;
      this.ngOnChanges({ version: { currentValue: this.version, previousValue: null, firstChange: true, isFirstChange: () => true } });
    }
  }

  private loadTechnologies(): void {
    this.technologies = [
      'Angular',
      'React',
      'Vue',
      'Node.js',
      'Java',
      'Python',
      'Ruby on Rails',
      'Spring Boot',
      'Django',
      'Flask'
    ];
  }


  save(): void {
    if (this.versionForm.valid) {
      const updatedVersion: VersionProjet = {
        ...this.version,
        ...this.versionForm.value,
        dateDebut: this.versionForm.value.dateDebut.toISOString(),
        dateFin: this.versionForm.value.dateFin.toISOString()
      };

      if (this.version && this.version.id) {
        this.versionService.updateVersion(this.version.id, updatedVersion).subscribe(
          updated => {
            this.dialogRef.close(updated);
          },
          error => {
            console.error('Error updating version:', error);
          }
        );
      }
    }
  }


  onCancel(): void {
    this.dialogRef.close();
  }
}
