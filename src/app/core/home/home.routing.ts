import { Route } from '@angular/router';
import { HomeComponent } from './home.component';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const homeRoutes: Route[] = [
    {
        path: '',
        component: HomeComponent
    }
];
