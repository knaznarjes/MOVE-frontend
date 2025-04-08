import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AuthModule } from './auth/auth.module';
import { IconsModule } from './icons/icons.module';
import { TranslocoCoreModule } from './transloco/transloco.module';
import { TravelerProfileModule } from './profile/traveler-profile.module';
import { AdminProfileModule } from './profile-admin/admin-profile.module';

@NgModule({
    imports: [
        CommonModule,
        AuthModule,
        IconsModule,
        TranslocoCoreModule,
        TravelerProfileModule,
        AdminProfileModule
    ],
    exports: [
        AuthModule,
        IconsModule,
        TranslocoCoreModule,
        TravelerProfileModule,
        AdminProfileModule
    ]
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule has already been loaded. Import this module in the AppModule only.');
        }
    }
}
