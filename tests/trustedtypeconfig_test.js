/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
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

    it('ignores quoted keywords when extracting policy names', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types foo bar \'keyword\'')
          .allowedPolicyNames).toEqual(['bar', 'foo']);
    });

    it('defaults to an empty set of allowed directives', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types')
          .allowedPolicyNames).toEqual([]);
    });

    it('does not allow http urls by default', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types')
          .allowHttpUrls).toEqual(false);
    });

    it('recognizes url-allow-http', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types \'url-allow-http\'')
          .allowHttpUrls).toEqual(true);
    });

    it('passes the CSP string to config object', () => {
      const csp = 'trusted-types a b c; script-src foo';
      expect(TrustedTypeConfig.fromCSP(csp)
          .cspString).toEqual(csp);
    });
  });
});
