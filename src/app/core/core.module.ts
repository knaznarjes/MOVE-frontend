import { CommonModule } from '@angular/common';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { AuthModule } from './auth/auth.module';
import { IconsModule } from './icons/icons.module';
import { TranslocoCoreModule } from './transloco/transloco.module';
import { TravelerProfileModule } from './traveler/profile/traveler-profile.module';
import { AdminProfileModule } from './admin/profile-admin/admin-profile.module';
import { MasterAdminProfileModule } from './master_admin/profile-master-admin/profile-master-admin.module';

@NgModule({
    imports: [
        CommonModule,
        AuthModule,
        IconsModule,
        TranslocoCoreModule,
        TravelerProfileModule,
        AdminProfileModule,
        MasterAdminProfileModule
    ],
    exports: [
        AuthModule,
        IconsModule,
        TranslocoCoreModule,
        TravelerProfileModule,
        AdminProfileModule,
        MasterAdminProfileModule

    ]
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule has already been loaded. Import this module in the AppModule only.');
        }
    }
}
