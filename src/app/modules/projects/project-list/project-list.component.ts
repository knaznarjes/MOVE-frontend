import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from 'app/modules/projects/services/project.service';
import { Projet } from '../projet.model';
import { Router } from '@angular/router';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-project-list',
    templateUrl: './project-list.component.html',
    styleUrls: ['./project-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectListComponent implements OnInit, OnDestroy {
    projets: Projet[] = [];
    filteredProjets: Projet[] = [];
    filters: {
        query$: BehaviorSubject<string>;
        hideCompleted$: BehaviorSubject<boolean>;
    } = {
        query$: new BehaviorSubject(''),
        hideCompleted$: new BehaviorSubject(false)
    };
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private projectService: ProjectService,
        private router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadProjets();
        combineLatest([this.filters.query$, this.filters.hideCompleted$])
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(([query, hideCompleted]) => {
                this.filteredProjets = this.projets;

                if (query) {
                    this.filteredProjets = this.filteredProjets.filter(projet =>
                        projet.nom.toLowerCase().includes(query.toLowerCase()) ||
                        projet.description.toLowerCase().includes(query.toLowerCase())
                    );
                }

                if (hideCompleted) {
                    this.filteredProjets = this.filteredProjets.filter(projet => projet.status !== 'Completed');
                }

                this._changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadProjets(): void {
        this.projectService.getAllProjets()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (data: Projet[]) => {
                    this.projets = data;
                    this.filteredProjets = data;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading projects:', error);
                }
            });
    }

    filterByQuery(query: string): void {
        this.filters.query$.next(query);
    }

    toggleCompleted(event: any): void {
        this.filters.hideCompleted$.next(event.checked);
    }

    addProject(): void {
        this.router.navigate(['/projects/new-project']);
    }

    viewDetails(id: string): void {
        this.router.navigate([`/projects/details/${id}`]);
    }

    confirmDelete(id: string): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '300px',
            data: { message: 'Are you sure you want to delete this project?' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.deleteProject(id);
            }
        });
    }

    deleteProject(id: string): void {
        this.projectService.deleteProjet(id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this.projets = this.projets.filter(projet => projet.id !== id);
                    this.filteredProjets = this.filteredProjets.filter(projet => projet.id !== id);
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    console.error('Error deleting project:', error);
                }
            });
    }
}
