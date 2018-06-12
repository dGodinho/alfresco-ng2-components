/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot,
  Router, PRIMARY_OUTLET, UrlTree, UrlSegmentGroup, UrlSegment
} from '@angular/router';
import { AppConfigService } from '../app-config/app-config.service';
import { AuthenticationService } from './authentication.service';
import { UserPreferencesService } from './user-preferences.service';

@Injectable()
export class AuthGuardBpm implements CanActivate, CanActivateChild {
    constructor(private authService: AuthenticationService,
                private router: Router,
                private userPreference: UserPreferencesService,
                private appConfig: AppConfigService) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.checkLogin(state.url);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(route, state);
    }

    checkLogin(redirectUrl: string): boolean {
        if (this.authService.isBpmLoggedIn()) {
            return true;
        }

        if (!this.authService.isOauth() || this.isOAuthWithoutSilentLogin() ) {
            const navigation = this.getNavigationCommands(redirectUrl);

            this.authService.setRedirect({ provider: 'BPM', navigation });
            const pathToLogin = this.getRouteDestinationForLogin();
            this.router.navigate(['/' + pathToLogin]);
        }

        return false;
    }

    isOAuthWithoutSilentLogin() {
        return this.authService.isOauth() && this.userPreference.oauthConfig.silentLogin === false;
    }

    private getRouteDestinationForLogin(): string {
        return this.appConfig &&
               this.appConfig.get<string>('loginRoute') ?
                        this.appConfig.get<string>('loginRoute') : 'login';
    }

    private getNavigationCommands(redirectUrl: string): any[] {
        const urlTree: UrlTree = this.router.parseUrl(redirectUrl);
        const urlSegmentGroup: UrlSegmentGroup = urlTree.root.children[PRIMARY_OUTLET];

        if (!urlSegmentGroup) {
            return [redirectUrl];
        }

        const urlSegments: UrlSegment[] = urlSegmentGroup.segments;

        return urlSegments.reduce(function(acc, item) {
            acc.push(item.path, item.parameters);
            return acc;
        }, []);
    }
}
