import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'project-list',
    loadChildren: () => import('./project-list/project-list-routing.module').then(m => m.ProjectListRoutingModule),
  },
  {
    path: 'new-project',
    loadChildren: () => import('./new-project/new-project-routing.module').then(m => m.NewProjectRoutingModule),
  },
  {
    path: 'details/:id',
    loadChildren: () => import('./details/details-routing.module').then(m => m.DetailsModule)
  },
  {
    path: 'details/:id/versions',
    loadChildren: () => import('./add-version/add-version-routing.module').then(m => m.AddVersionModule),
  },
  {
    path: '',
    redirectTo: 'project-list',
    pathMatch: 'full',
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProjectsRoutingModule { }
