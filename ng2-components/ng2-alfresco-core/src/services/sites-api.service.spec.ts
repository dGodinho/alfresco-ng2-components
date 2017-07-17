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

import { async, inject, TestBed } from '@angular/core/testing';
import { AlfrescoApiService } from './alfresco-api.service';
import { AppConfigModule } from './app-config.service';
import { NodesApiService } from './nodes-api.service';
import { SitesApiService } from './sites-api.service';
import { StorageService } from './storage.service';
import { UserPreferencesService } from './user-preferences.service';

class TestConfig {
    service: any = null;
    setup: any = {
        rejectGetSites: false
    };

    constructor(setup: any = {}) {
        Object.assign(this.setup, setup);

        const { alfrescoApiServiceMock } = this;

        const alfrescoApiServiceProvider = {
            provide: AlfrescoApiService,
            useValue: alfrescoApiServiceMock
        };

        TestBed.configureTestingModule({
            imports: [
                AppConfigModule.forRoot('app.config.json', {
                    pagination: {
                        size: 20
                    }
                })
            ],
            providers: [
                alfrescoApiServiceProvider,
                SitesApiService,
                NodesApiService,
                UserPreferencesService,
                StorageService
            ]
        });

        inject([ SitesApiService ], (service: SitesApiService) => {
            this.service = service;
        })();
    }

    private get alfrescoApiServiceMock(): any {
        const { setup } = this;

        const nodePagingSample = {
            list: {
                entries: [
                    { entry: {} },
                    { entry: {} }
                ],
                pagination: {}
            }
        };

        const sitesApiMock = {
            getSites: jasmine.createSpy('getSites').and.callFake(() => {
                return new Promise((resolve, reject) => {
                    setup.rejectGetSites
                        ? reject()
                        : resolve(nodePagingSample);
                });
            })
        };

        return {
            getInstance: () => {
                return {
                    core: { sitesApi: sitesApiMock }
                };
            }
        };
    }

    get getSitesSpy(): any {
        return this.service.sitesApi.getSites;
    }

    get getSitesArgs(): any[] {
        return this.getSitesSpy.calls.mostRecent().args;
    }
}

describe('Sites API', () => {
    describe('getSites', () => {
        describe('Provide a NodePaging', () => {
            beforeEach(() => {
                this.config = new TestConfig();
            });

            it('provides a node paging with entries', async(() => {
                this.config.service.getSites().subscribe((paging) => {
                    const { list: { entries, pagination } } = paging;

                    expect(entries).toEqual(jasmine.any(Array));
                    expect(pagination).toEqual(jasmine.any(Object));
                    expect(entries.length).toBe(2);
                });
            }));
        });

        describe('Manage query options', () => {
            beforeEach(() => {
                this.config = new TestConfig();

                this.getCalledArgs = () => {
                    return this.config.getSitesArgs;
                };
            });

            it('has default options', async(() => {
                this.config.service.getSites();

                const [ { maxItems, skipCount } ] = this.getCalledArgs();

                expect(maxItems).toBe(20);
                expect(skipCount).toBe(0);
            }));

            it('combines custom and default options', async(() => {
                this.config.service.getSites({
                    maxItems: 5
                });

                const [ { maxItems, skipCount } ] = this.getCalledArgs();

                expect(maxItems).toBe(5);
                expect(skipCount).toBe(0);
            }));
        });

        describe('Error handling', () => {
            beforeEach(() => {
                const config = new TestConfig({
                    rejectGetSites: true
                });

                this.service = config.service;
                this.spy = spyOn(config.service, 'handleError')
                    .and.callThrough();
            });

            it('handles error on failure', async(() => {
                this.service.getSites().subscribe(() => {
                    expect(this.spy).toHaveBeenCalled();
                });
            }));
        });
    });
});
