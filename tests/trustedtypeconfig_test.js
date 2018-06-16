/*
Copyright 2018 Google Inc.

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
import {TrustedTypeConfig} from '../src/data/trustedtypeconfig.js';

describe('TrustedTypeConfig', () => {
  describe('parseCSP', () => {
    it('parses policy with a single directive', () => {
      const policy = `default-src 'self'`;
      expect(TrustedTypeConfig.parseCSP(policy)).toEqual(
          {'default-src': ['\'self\'']});
    });

    it('parses policy with a multiple directives', () => {
      const policy = `default-src 'self'; connect-src http://foo.bar`;
      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': ['\'self\''],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('ignores empty directives', () => {
      const policy = `default-src 'self';; connect-src http://foo.bar`;
      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('ignores whitespace', () => {
      const policy = `\ndefault-src    'self';    \t connect-src\n\thttp://foo.bar  `;
      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('supports multiple directive values', () => {
      const policy = `default-src 'self' https://a *; connect-src http://foo.bar`;
      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`, '*', 'https://a'],
        'connect-src': ['http://foo.bar'],
      });
    });
  });

  describe('fromCSP', () => {
    it('always enabled logging', () => {
      expect(TrustedTypeConfig.fromCSP('').isLoggingEnabled).toBe(true);
      expect(TrustedTypeConfig.fromCSP('trusted-types').isLoggingEnabled)
        .toBe(true);
    });

    it('enforces iif trusted-types directive is present', () => {
      expect(TrustedTypeConfig.fromCSP('').isEnforcementEnabled).toBe(false);
      expect(TrustedTypeConfig.fromCSP('trusted-types').isEnforcementEnabled)
        .toBe(true);
    });

    it('uses whitelisted directive names from the directive', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types foo bar *')
          .allowedPolicyNames).toEqual(['*', 'bar', 'foo']);
    });

    it('defaults to an empty set of allowed directives', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types')
          .allowedPolicyNames).toEqual([]);
    });
  });
});
