// app.routes.ts
import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';
// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path
    { path: '', pathMatch: 'full', redirectTo: 'home' },

    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'example' },

    // Auth routes for guests
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'home',loadChildren: () => import('app/core/home/home.module').then(m => m.HomeModule) },
            {path: 'register',loadChildren: () => import('app/core/auth/register/register.module').then(m => m.RegisterModule)},
            {path: 'login',loadChildren: () => import('app/core/auth/login/login.module').then(m => m.LoginModule)}
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: 'home',loadChildren: () => import('app/core/home/home.module').then(m => m.HomeModule) }
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            {
                path: 'profile-admin',
                loadChildren: () => import('app/core/profile-admin/proflie-admin.module')
                    .then(m => m.ProfileAdminModule)
            },
            {
                path: 'projects',
                loadChildren: () => import('app/modules/projects/projects-routing.module').then(m => m.ProjectsRoutingModule)
            },
            {
                path: 'developers',
                loadChildren: () => import('app/modules/developers/developers-routing.module').then(m => m.DevelopersModule)
            }
        ]
    }
];
