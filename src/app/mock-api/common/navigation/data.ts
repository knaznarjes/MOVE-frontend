/* tslint:disable:max-line-length */
import { FuseNavigationItem } from '@fuse/components/navigation';


export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'projects',
        title: 'Projects',
        type: 'basic',
        icon: 'heroicons_outline:folder',
        link: '/projects'
    },
    {
        id: 'developers',
        title: 'Developers',
        type: 'basic',
        icon: 'heroicons_outline:user',
        link: '/developers'
    }
];
export const compactNavigation: FuseNavigationItem[] = [
    ...defaultNavigation
];
export const futuristicNavigation: FuseNavigationItem[] = [
    ...defaultNavigation
];
export const horizontalNavigation: FuseNavigationItem[] = [
    ...defaultNavigation
];
