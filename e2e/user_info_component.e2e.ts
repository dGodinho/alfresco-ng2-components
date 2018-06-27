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

import AdfSettingsPage = require('./pages/adf/settingsPage.js');
import AdfLoginPage = require('./pages/adf/loginPage.js');
import UserInfoDialog = require('./pages/adf/dialog/userInfoDialog.js');
import NavigationBarPage = require('./pages/adf/navigationBarPage.js');

import AcsUserModel = require('./models/ACS/acsUserModel.js');
import FileModel = require('./models/ACS/fileModel.js');
import User = require('./models/APS/User');

import PeopleAPI = require('./restAPI/ACS/PeopleAPI.js');
import UserProfileAPI = require('./restAPI/APS/enterprise/UserProfileAPI.js');
import UserAPI = require('./restAPI/APS/enterprise/UsersAPI');
import BasicAuthorization = require('./restAPI/httpRequest/BasicAuthorization');

import TestConfig = require('./test.config.js');
import resources = require('./util/resources.js');
import TenantsAPI = require('./restAPI/APS/enterprise/TenantsAPI');
import Tenant = require('./models/APS/Tenant');

describe('Test User Info component', () => {

    let adfSettingsPage = new AdfSettingsPage();
    let adfLoginPage = new AdfLoginPage();
    let navigationBarPage = new NavigationBarPage();
    let userInfoDialog = new UserInfoDialog();
    let adminACSUserModel = new AcsUserModel({
        'id': TestConfig.adf.adminUser,
        'password': TestConfig.adf.adminPassword
    });
    let acsAvatarFileModel = new FileModel({
        'name': resources.Files.PROFILE_IMAGES.ECM.file_name,
        'location': resources.Files.PROFILE_IMAGES.ECM.file_location
    });
    let apsAvatarFileModel = new FileModel({
        'name': resources.Files.PROFILE_IMAGES.BPM.file_name,
        'location': resources.Files.PROFILE_IMAGES.BPM.file_location
    });
    let basicAuthAdmin = new BasicAuthorization(TestConfig.adf.adminEmail, TestConfig.adf.adminPassword);
    let basicAuth, contentUserModel, processUserModel, retry = 20;

    beforeAll( (done) => {
        new TenantsAPI().createTenant(basicAuthAdmin, new Tenant())
            .then(function (result) {
                return new UserAPI().createUser(basicAuthAdmin, processUserModel = new User({ tenantId: JSON.parse(result.responseBody).id }));
            })
            .then(() => {
                contentUserModel = new AcsUserModel({
                    'id': processUserModel.email,
                    'password': processUserModel.password,
                    'firstName': processUserModel.firstName,
                    'lastName': processUserModel.lastName,
                    'email': processUserModel.email
                });
                basicAuth = new BasicAuthorization(processUserModel.email, processUserModel.password);
                return PeopleAPI.createUserViaAPI(adminACSUserModel, contentUserModel);
            })
            .then(() => {
                done();
            });
    });

    it('1. Enable Process Services and Content Services ', () => {
        adfLoginPage.goToLoginPage();
        adfSettingsPage.setProviderEcmBpm();
        adfLoginPage.login(contentUserModel.id, contentUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.dialogIsDisplayed().contentServicesTabIsDisplayed().processServicesTabIsDisplayed();
        expect(userInfoDialog.getContentHeaderTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentEmail()).toEqual(contentUserModel.email);
        expect(userInfoDialog.getContentJobTitle()).toEqual(contentUserModel.jobTitle);
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.clickOnContentServicesTab();
        expect(userInfoDialog.getContentHeaderTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentEmail()).toEqual(contentUserModel.email);
        expect(userInfoDialog.getContentJobTitle()).toEqual(contentUserModel.jobTitle);
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.clickOnProcessServicesTab().processServicesTabIsDisplayed();
        expect(userInfoDialog.getProcessHeaderTitle()).toEqual(processUserModel.firstName + ' ' + processUserModel.lastName);
        expect(userInfoDialog.getProcessTitle()).toEqual(processUserModel.firstName + ' ' + processUserModel.lastName);
        expect(userInfoDialog.getProcessEmail()).toEqual(processUserModel.email);
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });

    it('2. Enable Content Services and disable Process Services ', () => {
        navigationBarPage.clickLoginButton();
        adfSettingsPage.setProviderEcm();
        adfLoginPage.login(contentUserModel.id, contentUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.dialogIsDisplayed().contentServicesTabIsNotDisplayed().processServicesTabIsNotDisplayed();
        expect(userInfoDialog.getContentHeaderTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentTitle()).toEqual(contentUserModel.firstName + ' ' + contentUserModel.lastName);
        expect(userInfoDialog.getContentEmail()).toEqual(contentUserModel.email);
        expect(userInfoDialog.getContentJobTitle()).toEqual(contentUserModel.jobTitle);
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });

    it('3. Enable Process Services and disable Content Services ', () => {
        navigationBarPage.clickLoginButton();
        adfSettingsPage.setProviderBpm();
        adfLoginPage.login(processUserModel.email, processUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.dialogIsDisplayed().contentServicesTabIsNotDisplayed().processServicesTabIsNotDisplayed();
        expect(userInfoDialog.getProcessHeaderTitle()).toEqual(processUserModel.firstName + ' ' + processUserModel.lastName);
        expect(userInfoDialog.getProcessTitle()).toEqual(processUserModel.firstName + ' ' + processUserModel.lastName);
        expect(userInfoDialog.getProcessEmail()).toEqual(processUserModel.email);
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });

    it('4. Enable Process Services and Content Services ', () => {
        let flow = protractor.promise.controlFlow();
        flow.execute(() => {
            PeopleAPI.updateAvatarViaAPI(contentUserModel, acsAvatarFileModel, '-me-');
            PeopleAPI.getAvatarViaAPI(retry, contentUserModel, '-me-', function (result) {
            });
        });

        navigationBarPage.clickLoginButton();
        adfSettingsPage.setProviderEcm();
        adfLoginPage.login(contentUserModel.id, contentUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.checkACSProfileImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });

    it('5. The profile picture is changed from APS', () => {
        navigationBarPage.clickLoginButton();
        new UserProfileAPI().changeProfilePicture(basicAuth, apsAvatarFileModel.getLocation());

        adfSettingsPage.setProviderBpm();
        adfLoginPage.login(processUserModel.email, processUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.checkAPSProfileImage();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.initialImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });

    it('6. Delete the profile picture from ACS', () => {
        navigationBarPage.clickLoginButton();
        PeopleAPI.deleteAvatarViaAPI(contentUserModel, '-me-');
        adfSettingsPage.setProviderEcm();
        adfLoginPage.login(contentUserModel.id, contentUserModel.password);
        navigationBarPage.clickUserProfile();
        userInfoDialog.checkInitialImage();
        userInfoDialog.APSProfileImageNotDisplayed();
        userInfoDialog.ACSProfileImageNotDisplayed();
        userInfoDialog.closeUserProfile();
    });
});