/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Route } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { TravelerProfileComponent } from './core/profile/traveler-profile.component';
import { RoleGuard } from './core/auth/guards/role.guard';

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
                loadChildren: () => import('./core/home/home.module').then(m => m.HomeModule) // Cette route est publique, pas protégée par AuthGuard
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
                component: TravelerProfileComponent
            }
        ]
        /* ,
            {
                path: 'admin',
                canActivate: [RoleGuard],
                data: {
                    role: 'ADMIN'
                },
                loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
            },
            {
                path: 'dashboard',
                loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
            }*/
    },

    // Route wildcard pour 404
    {
        path: '**',
        redirectTo: 'home'
    }
];

