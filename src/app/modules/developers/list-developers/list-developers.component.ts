import { Component, OnInit, ViewChild } from '@angular/core';
import { PersonnelService } from 'app/modules/developers/developers.service';
import { Personnel } from 'app/modules/developers/developers.model';
import { MatDrawer } from '@angular/material/sidenav';
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { AddDeveloperDialogComponent } from 'app/modules/developers/developer-dialog/add-developer-dialog.component';
import { EditDeveloperDialogComponent } from 'app/modules/developers/EditDeveloperDialog/edit-developer-dialog.component';
import { ConfirmDialogComponent } from 'app/modules/developers/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-list-developers',
  templateUrl: './list-developers.component.html',
  styleUrls: ['./list-developers.component.scss']
})
export class ListDevelopersComponent implements OnInit {
  @ViewChild('matDrawer') matDrawer: MatDrawer;
  personnels: Personnel[] = [];
  selectedPersonnel: Personnel | null = null;
  drawerOpened = false;
  searchInputControl = new UntypedFormControl();

  constructor(private personnelService: PersonnelService, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.loadPersonnels();

    this.searchInputControl.valueChanges.subscribe(value => {
      this.loadPersonnels(value);
    });
  }

  loadPersonnels(query: string = ''): void {
    this.personnelService.getAllPersonnel(query).subscribe({
      next: (data: Personnel[]) => {
        this.personnels = data;
      },
      error: (err) => {
        console.error('Error fetching personnel.', err);
      }
    });
  }

  selectPersonnel(personnel: Personnel): void {
    this.selectedPersonnel = personnel;
    this.drawerOpened = true;
  }

  openAddDeveloperDialog(): void {
    const dialogRef = this.dialog.open(AddDeveloperDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.personnelService.createPersonnel(result).subscribe({
          next: (newPersonnel: Personnel) => {
            this.loadPersonnels();
          },
          error: (err) => {
            console.error('Error adding personnel.', err);
          }
        });
      }
    });
  }

  openEditDeveloperDialog(): void {
    if (this.selectedPersonnel) {
      const dialogRef = this.dialog.open(EditDeveloperDialogComponent, {
        width: '400px',
        data: this.selectedPersonnel
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.personnelService.updatePersonnel(result).subscribe({
            next: (updatedPersonnel: Personnel) => {
              this.loadPersonnels();
            },
            error: (err) => {
              console.error('Error updating personnel.', err);
            }
          });
        }
      });
    }
  }

  deletePersonnel(): void {
    if (this.selectedPersonnel) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px',
        data: { message: 'Are you sure you want to delete this developer?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.personnelService.deletePersonnel(this.selectedPersonnel.id).subscribe({
            next: () => {
              this.selectedPersonnel = null;
              this.drawerOpened = false;
              this.loadPersonnels();
            },
            error: (err) => {
              console.error('Error deleting personnel.', err);
            }
          });
        }
      });
    }
  }
}
