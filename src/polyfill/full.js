/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @fileoverview Entry point for a polyfill that enforces the types.
 */
import {TrustedTypesEnforcer} from '../enforcer.js';
import {TrustedTypeConfig} from '../data/trustedtypeconfig.js';
/* eslint-disable no-unused-vars */
import {TrustedTypes} from './api_only.js';

/* eslint-enable no-unused-vars */

/**
 * Bootstraps all trusted types polyfill and their enforcement.
 */
export function bootstrap() {
  const config = new TrustedTypeConfig(
    /* isLoggingEnabled */ true,
    /* isEnforcementEnabled */ true);

  const trustedTypesEnforcer = new TrustedTypesEnforcer(config);

  trustedTypesEnforcer.install();
}

bootstrap();
