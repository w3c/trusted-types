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
 * Tries to guess a CSP policy from:
 *  - the current polyfill script element text content (if prefixed with
 *    "Content-Security-Policy:")
 *  - the data-csp attribute value of the current script element.
 *  - meta header
 * @return {?string} Guessed CSP value, or null.
 */
function detectPolicy() {
    try {
        const currentScript = document.currentScript || (function() {
          let scripts = document.getElementsByTagName('script');
          return scripts[scripts.length - 1];
        })();

        const bodyPrefix = 'Content-Security-Policy:';
        if (currentScript &&
            currentScript.textContent.trim().substr(0, bodyPrefix.length) ==
                bodyPrefix) {
            return currentScript.textContent.trim().slice(bodyPrefix.length);
        }
        if (currentScript.dataset.csp) {
            return currentScript.dataset.csp;
        }
        const cspInMeta = document.head.querySelector(
            'meta[http-equiv^="Content-Security-Policy"]');
        if (cspInMeta) {
            return cspInMeta.content.trim();
        }
    } catch (e) {
        return null;
    }
    return null;
}

/**
 * Bootstraps all trusted types polyfill and their enforcement.
 */
export function bootstrap() {
  const csp = detectPolicy();
  const config = csp ? TrustedTypeConfig.fromCSP(csp) : new TrustedTypeConfig(
    /* isLoggingEnabled */ true,
    /* isEnforcementEnabled */ true,
    /* fallbackPolicyName */ null,
    /* allowedPolicyNames */ ['*']);

  const trustedTypesEnforcer = new TrustedTypesEnforcer(config);

  trustedTypesEnforcer.install();
}

bootstrap();
