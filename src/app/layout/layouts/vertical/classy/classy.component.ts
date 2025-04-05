import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/models/models';
import { User as UserTypes } from 'app/core/user/user.types';

@Component({
    selector     : 'classy-layout',
    templateUrl  : './classy.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean = false;
    // Initialiser navigation avec une valeur par défaut
    navigation: Navigation = {
        default: [],
        compact: [],
        futuristic: [],
        horizontal: []
    };
    user: User | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _userService: UserService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService
    )
    {
        // Vous pouvez également initialiser ici si nécessaire
        // this._navigationService.get().then(navigation => {
        //    this.navigation = navigation;
        // });
    }

    /**
     * Getter for current year
     */
    get currentYear(): number
    {
        return new Date().getFullYear();
    }

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                console.log('Navigation reçue:', navigation); // Ajout de log
                if (navigation) {
                    this.navigation = navigation;
                } else {
                    console.warn('Navigation est undefined ou null');
                    // Définir une navigation par défaut pour éviter les erreurs
                }
            });

        // Subscribe to the user service
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((userFromService: UserTypes) => {
                console.log('User reçu:', userFromService); // Ajout de log
                if (userFromService) {
                    // Convertir du type User de user.types vers le type User de models
                    this.user = {
                        id: userFromService.id,
                        fullName: userFromService.fullName || '',
                        email: userFromService.email,
                        role: userFromService.role || 'TRAVELER',
                        photoProfile: null  // Use photoProfile instead of profilePhotoUrl
                    };

                    // If you need to use the avatar from userFromService elsewhere, you can store it in a separate property
                    // this.userAvatar = userFromService.avatar;
                }
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void
    {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent(name);

        if (navigation && navigation instanceof FuseVerticalNavigationComponent)
        {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
