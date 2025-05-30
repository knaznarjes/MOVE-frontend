/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Route } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { TravelerProfileComponent } from './core/traveler/profile/traveler-profile.component';
import { RoleGuard } from './core/auth/guards/role.guard';
import { AdminProfileComponent } from './core/admin/profile-admin/admin-profile.component';
import { MasterAdminProfileComponent } from './core/master_admin/profile-master-admin/profile-master-admin.component';
import { ContentDetailsComponent } from './core/content/contents/content-details/content-details.component';
import { ContentFormComponent } from './core/content/contents/content-form/content-form.component';
import { ContentHomeComponent } from './core/content/contents/content-home/content-home.component';
import { NotificationComponent } from './core/content/notification/notification.component';

export const appRoutes: Route[] = [
    // Routes publiques (pas besoin d'être connecté)
    {
        path: '',
        component: LayoutComponent,
        data: { layout: 'empty' },
        children: [
            {
                path: 'home',
                loadChildren: () =>
                    import('./core/home/home.module').then(m => m.HomeModule)
            },
            {
                path: 'register',
                loadChildren: () =>
                    import('./core/auth/register/register.module').then(m => m.RegisterModule)
            },
            {
                path: 'login',
                loadChildren: () =>
                    import('./core/auth/login/login.module').then(m => m.LoginModule)
            }
        ]
    },

    // Routes privées (nécessitent authentification)
    {
        path: '',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        children: [
              {
            path: 'notification-details/:id',
                component: NotificationComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['MASTERADMIN', 'ADMIN', 'TRAVELER'] }
        },
            {
                path: 'profile',
                component: TravelerProfileComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['TRAVELER'] }
            },
            {
                path: 'admin/profile',
                component: AdminProfileComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['ADMIN'] }
            },
            {
                path: 'master/admin/profile',
                component: MasterAdminProfileComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['MASTERADMIN'] }
            },
            {
                path: 'homecontent',
                component: ContentHomeComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['MASTERADMIN', 'ADMIN', 'TRAVELER'] }
            },
            {
                path: 'add/content',
                component: ContentFormComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['TRAVELER'] }
            },
            {
                path: 'edit/:id',
                component: ContentFormComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['TRAVELER'] }
            },
            {
                path: 'content/:id',
                component: ContentDetailsComponent,
                canActivate: [RoleGuard],
                data: { allowedRoles: ['MASTERADMIN', 'ADMIN', 'TRAVELER'] }
            }
        ]
    },
    // Wildcard pour 404 (redirige vers home)
    {
        path: '**',
        redirectTo: 'home'
    }
];
