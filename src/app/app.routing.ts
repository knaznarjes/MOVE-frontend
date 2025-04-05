// app.routes.ts
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Route } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { TravelerProfileComponent } from './core/profile/traveler-profile.component';
import { RoleGuard } from './core/auth/guards/role.guard';
import { AdminProfileComponent } from './core/profile-admin/admin-profile.component';

export const appRoutes: Route[] = [
    // Rediriger le chemin vide vers 'home'
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home'
    },

    // Routes pour les invités (non authentifiés)
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: 'home',
                loadChildren: () => import('./core/home/home.module').then(m => m.HomeModule)
            },
            {
                path: 'register',
                loadChildren: () => import('./core/auth/register/register.module').then(m => m.RegisterModule)
            },
            {
                path: 'login',
                loadChildren: () => import('./core/auth/login/login.module').then(m => m.LoginModule)
            }
        ]
    },

    // Routes authentifiées
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        children: [
            {
                path: 'profile',
                component: TravelerProfileComponent,
                canActivate: [RoleGuard],
                data: {
                    allowedRoles: ['TRAVELER', 'USER'] // Permettre les rôles de voyageur/utilisateur
                }
            },
            {
                path: 'admin/profile',
                component: AdminProfileComponent,
                canActivate: [RoleGuard],
                data: {
                    allowedRoles: ['ADMIN']
                }
            }
        ]
    },

    // Route wildcard pour 404
    {
        path: '**',
        redirectTo: 'home'
    }
];
