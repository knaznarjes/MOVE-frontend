import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { User } from 'app/core/models/models';
import { AccountService } from 'app/core/services/account.service';
import { UserService } from 'app/core/services/user.service';
import { AuthService } from 'app/core/services/auth.service';

@Component({
    selector     : 'classy-layout',
    templateUrl  : './classy.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls    : ['./classy.component.scss']
})
export class ClassyLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean = false;
    // Initialize navigation with a default value
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
        private _accountService: AccountService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _authService: AuthService

    )
    {
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
                console.log('Navigation received:', navigation);
                if (navigation) {
                    this.navigation = navigation;
                } else {
                    console.warn('Navigation is undefined or null');
                    // Define a default navigation to avoid errors
                }
            });

        // Get current user from UserService
        this._userService.getCurrentUser()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (userDTO) => {
                    console.log('User received:', userDTO);
                    if (userDTO) {
                        // Map the UserDTO to User model correctly
                        this.user = {
                            id: userDTO.id,
                            fullName: userDTO.fullName || 'User',
                            role: userDTO.role || '',
                            photoProfile: userDTO.photoProfile || null,
                            creationDate: userDTO.creationDate || new Date(),
                            account: {
                                id: userDTO.account?.id || '',
                                email: userDTO.account?.email || ''
                            }
                        };
                        console.log('User mapped:', this.user);
                    }
                },
                error: (error) => {
                    console.error('Error fetching user:', error);
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
    logout(): void {
        this._authService.logout();
    }
}
