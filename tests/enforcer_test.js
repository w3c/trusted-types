/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */
import {TrustedTypeConfig} from '../src/data/trustedtypeconfig.js';
import {TrustedTypesEnforcer} from '../src/enforcer.js';
import {TrustedTypes} from '../src/trustedtypes.js';

describe('TrustedTypesEnforcer', function() {
  let TEST_HTML = '<b>html</b>';

  let TEST_URL = 'http://example.com/script';

  let EVIL_URL = 'http://evil.example.com/script';

  const noopPolicy = (p) => {
          p.createHTML = (s) => s;
          p.createScriptURL = (s) => s;
          p.createURL = (s) => s;
          p.createScript = (s) => s;
  };

  let ENFORCING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      /* fallbackPolicy */ null,
      /* allowedPolicyNames */ ['*']);

  let NOOP_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ false,
      /* fallbackPolicy */ null,
      /* allowedPolicyNames */ ['*']
  );

  let LOGGING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ true,
      /* isEnforcementEnabled */ false,
      /* fallbackPolicy */ null,
      /* allowedPolicyNames */ ['*']
  );

  describe('install', function() {
    let enforcer;

    afterEach(function() {
      if (enforcer) {
        let testCleanedUp = false;
        try {
          enforcer.uninstall();
        } catch (ex) {
          // Test cleaned up after itself.
          testCleanedUp = true;
        }
        enforcer = undefined;
        if (!testCleanedUp) {
          throw new Error('Test did not clean up enforcer');
        }
      }
    });

    it('starts enforcing only after being called', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      let el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      enforcer.install();
      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrowError(TypeError);

      // TODO(msamuel): move to after test action.
      enforcer.uninstall();
    });

    it('does not enforce if no logging and no enforcement is required', () => {
      let enforcer = new TrustedTypesEnforcer(NOOP_CONFIG);
      let el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      enforcer.install();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      expect(el.innerHTML).toEqual(TEST_HTML);

      // TODO(msamuel): move to after test action.
      enforcer.uninstall();
    });

    it('cannot be called twice', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();

      expect(function() {
        enforcer.install();
      }).toThrow();

      enforcer.uninstall();

      // Attempted double installation does not leave us in a state
      // where two uninstalls are necessary/allowed.
      expect(function() {
        enforcer.uninstall();
      }).toThrow();
    });
  });

  describe('uninstall', function() {
    let enforcer;

    it('allows for uninstalling policies', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      let el = document.createElement('div');
      enforcer.install();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrow();
      expect(el.innerHTML).toEqual(''); // Side effect did not happen.
      // TODO: should template elements allow innerHTML assignment?

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).toThrow();
      expect(el.innerHTML).toEqual('');

      enforcer.uninstall();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrowError(TypeError);
      // TODO(msamuel): why check error type but not when expecting error above?
      expect(el.innerHTML).toEqual(TEST_HTML); // Roughly

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).not.toThrowError(TypeError);
      expect(el.innerHTML).toEqual(`${TEST_HTML}${TEST_HTML}`); // Roughly
    });

    it('restores the script getters & setters', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      let el = document.createElement('script');
      el.textContent = 'foo';

      enforcer.install();
      enforcer.uninstall();

      // Make sure the original setters are called.
      expect(el.textContent).toEqual('foo');
      el.innerText = 'bar';
      expect(el.textContent).toEqual('bar');
      el.text = 'baz';
      expect(el.innerText).toEqual('baz');
    });

    it('cannot be called twice', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      enforcer.uninstall();
      expect(function() {
        enforcer.uninstall();
      }).toThrow();
    });
  });

  describe('log-only config', function() {
    let enforcer;
    let el;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(LOGGING_CONFIG);
      policy = TrustedTypes.createPolicy(Math.random(), (p) => {
        noopPolicy(p);
        p.expose = true;
      });
      enforcer.install();
      el = document.createElement('div');
      spyOn(console, 'warn');
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('allows for string assignments', function() {
      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();
      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('allows for typed assignments', function() {
      expect(function() {
        el.innerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();
      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('logs for string assignments', function() {
      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to set innerHTML property on [object HTMLDivElement]: This ' +
        'document requires `TrustedHTML` assignment.', 'innerHTML',
        jasmine.any(HTMLDivElement), TrustedTypes.TrustedHTML, TEST_HTML);
    });

    it('does not logs for typed assignments', function() {
      expect(function() {
        el.innerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();
      // eslint-disable-next-line no-console
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('enforcing config', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('allows for assigning function to event handler properties', () => {
      let el = document.createElement('div');
      let spy = spyOn(window, 'alert');
      el.onclick = window.alert;
      el.onclick();
      expect(spy).toHaveBeenCalled();
    });

    it('allows for assigning null to event handler properties', () => {
      let el = document.createElement('div');
      el.onclick = null;
    });
  });

  describe('url-allow-http config', () => {
    let enforcer;
    let el;
    let policy;

    beforeEach(function() {
      el = document.createElement('a');
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      /* fallbackPolicy */ null,
      /* allowedPolicyNames */ ['*'],
      /* allowHttpUrls */ true));
      enforcer.install();
      policy = TrustedTypes.createPolicy(Math.random(), noopPolicy);
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('allows typed values for url sinks', () => {
      el.href = policy.createURL('http://example.com/');
      expect(el.href).toEqual('http://example.com/');
    });

    it('allows typed values for with javascript: protocol', () => {
      el.href = policy.createURL('javascript:alert(1)');
      expect(el.href).toEqual('javascript:alert(1)');
    });

    it('allows strings with http urls', () => {
      el.href = 'http://example.com/';
      expect(el.href).toEqual('http://example.com/');
    });

    it('allows strings with https urls', () => {
      el.href = 'https://example.com/';
      expect(el.href).toEqual('https://example.com/');
    });

    it('allows strings with relative urls', () => {
      el.href = 'foo/bar';
      expect(el.href).toEqual(location.origin + '/foo/bar');
    });

    it('rejects http urls for TrustedScriptURL sinks', () => {
      const el = document.createElement('script');
      expect(() => {
        el.src = 'https://evil.com';
      }).toThrowError(TypeError);
      expect(el.src).toEqual('');
    });
  });

  describe('enforcement disables string assignments', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      let el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrow();
      expect(el.innerHTML).toEqual('');
    });

    it('on outerHTML', function() {
      let wrap = document.createElement('div');
      let el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = TEST_HTML;
      }).toThrow();
      expect(el.outerHTML).toEqual('<div></div>');
    });

    it('on iframe srcdoc', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.srcdoc = TEST_HTML;
      }).toThrow();
      expect(!el.srcdoc).toEqual(true);
    });

    it('on a href', function() {
      let el = document.createElement('a');

      expect(function() {
        el.href = TEST_URL;
      }).toThrow();
      expect(!el.srcdoc).toEqual(true);
    });

    it('on object codebase', function() {
      let el = document.createElement('object');

      expect(function() {
        el.setAttribute('codebase', TEST_URL);
      }).toThrow();

      expect(el.codeBase).toBe('');
    });

    it('on Range.createContextualFragment', function() {
      let range = document.createRange();

      expect(function() {
        range.createContextualFragment(TEST_HTML);
      }).toThrow();
    });

    it('on Element.insertAdjacentHTML', function() {
      let el = document.createElement('div');

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).toThrow();
      expect(el.innerHTML).toEqual('');
    });

    it('on HTMLScriptElement.src', function() {
      let el = document.createElement('script');

      expect(function() {
        el.src = TEST_URL;
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on inline event handlers via setAttribute', function() {
      let el = document.createElement('a');

      expect(function() {
        el.setAttribute('onclick', 'console.log(1)');
      }).toThrow();

      expect(el.onclick).toBe(null);
    });

    it('on inert element inline event handlers via setAttribute', function() {
      let el = document.createElement('section');

      expect(function() {
        el.setAttribute('onclick', 'console.log(1)');
      }).toThrow();

      expect(el.onclick).toBe(null);
    });

    it('on HTMLScriptElement.innerText', function() {
      let el = document.createElement('script');

      expect(function() {
        el.innerText = 'console.log(1)';
      }).toThrow();

      expect(el.innerText).toEqual('');
    });

    it('on HTMLScriptElement.text', function() {
      let el = document.createElement('script');

      expect(function() {
        el.text = 'console.log(1)';
      }).toThrow();

      expect(el.text).toEqual('');
    });

    it('on HTMLScriptElement.textContent', function() {
      let el = document.createElement('script');

      expect(function() {
        el.textContent = 'console.log(1)';
      }).toThrow();

      expect(el.textContent).toEqual('');
    });

    it('on Element.prototype.setAttribute', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.setAttribute('src', TEST_URL);
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on Element.prototype.setAttributeNS', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.setAttributeNS('http://www.w3.org/1999/xhtml', 'src', TEST_URL);
      }).toThrow();

      expect(el.getAttributeNS('http://www.w3.org/1999/xhtml', 'src')).toEqual(null);
    });

    it('on document.write', function() {
      expect(function() {
        document.write('<foo>');
      }).toThrow();
      expect(document.body.innerHTML).not.toContain('<foo>');
    });

    it('on window.open', function() {
      enforcer.uninstall();
      const mockOpen = spyOn(window, 'open');
      enforcer.install();
      expect(function() {
        window.open('/');
      }).toThrow();
      expect(mockOpen).not.toHaveBeenCalled();
    });

    it('on DOMParser.parseFromString', function() {
      expect(function() {
        new DOMParser().parseFromString('<foo>', 'text/html');
      }).toThrow();
    });

    // TODO: fix #47
    xit('on copy attribute crossing types', function() {
      let div = document.createElement('div');
      let img = document.createElement('img');

      div.setAttribute('src', TEST_URL);
      let attr = div.getAttributeNode('src');
      div.removeAttributeNode(attr);

      expect(function() {
        img.setAttributeNode(attr);
      }).toThrow();

      expect(img.src).toEqual('');
    });

    it('on copy innocuous attribute', function() {
      let div = document.createElement('div');
      let span = document.createElement('span');

      div.setAttribute('src', TEST_URL);
      let attr = div.getAttributeNode('src');
      div.removeAttributeNode(attr);
      span.setAttributeNode(attr);

      expect(span.getAttribute('src')).toEqual(TEST_URL);
    });

    it('on non-lowercase Element.prototype.setAttribute', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.setAttribute('SrC', TEST_URL);
      }).toThrow();

      expect(el.src).toEqual('');
    });
  });

  describe('setAttributeWrapper', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('passes through inert attributes', function() {
      let el = document.createElement('link');
      el.setAttribute('rel', 'stylesheet');
      expect(el.getAttribute('rel')).toEqual('stylesheet');
      expect(el.rel).toEqual('stylesheet');
    });

    it('passes through inert elements', function() {
      let el = document.createElement('section');
      el.setAttribute('id', 'foo');
      expect(el.getAttribute('id')).toEqual('foo');
      expect(el.id).toEqual('foo');
    });

    it('passes through on attributes if the event is unknown', function() {
      let el = document.createElement('section');
      el.setAttribute('ontotallyfakeevent', 'foo');
      expect(el.getAttribute('ontotallyfakeevent')).toEqual('foo');
    });
  });

  describe('enforcement allows type-based assignments', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy(Math.random(), (p) => {
        noopPolicy(p);
        p.expose = true;
      });
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      let el = document.createElement('div');
      el.innerHTML = policy.createHTML(TEST_HTML);

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('on outerHTML', function() {
      let wrap = document.createElement('div');
      let el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();
    });

    it('on iframe srcdoc', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.srcdoc = policy.createHTML(TEST_HTML);
      }).not.toThrow();

      expect(el.srcdoc).toEqual(TEST_HTML);
    });

    it('on Range.createContextualFragment', function() {
      let range = document.createRange();

      let fragment = range.createContextualFragment(
          policy.createHTML(TEST_HTML));

      expect(fragment.children[0].outerHTML).toEqual(TEST_HTML);
    });


    it('on Element.insertAdjacentHTML', function() {
      let el = document.createElement('div');

      el.insertAdjacentHTML('afterbegin', policy.createHTML('bar'));
      el.insertAdjacentHTML('afterbegin', policy.createHTML('foo'));

      expect(el.innerHTML).toEqual('foo' + 'bar');
    });

    it('on HTMLScriptElement.src', function() {
      let el = document.createElement('script');

      el.src = policy.createScriptURL(TEST_URL);

      expect(el.src).toEqual(TEST_URL);
    });

    it('on inline event handlers via setAttribute', function() {
      let el = document.createElement('a');
      const alert = spyOn(window, 'alert');

      expect(function() {
        el.setAttribute('onclick', policy.createScript('window.alert()'));
      }).not.toThrow();

      el.onclick();
      expect(alert).toHaveBeenCalled();
    });

    it('on HTMLScriptElement.innerText', function() {
      let el = document.createElement('script');

      expect(function() {
        el.innerText = policy.createScript('console.log(1)');
      }).not.toThrow();

      expect(el.innerText).toEqual('console.log(1)');
    });

    it('on document.write', function() {
      enforcer.uninstall();
      const mockWrite = spyOn(document, 'write');
      enforcer.install();
      const html = policy.createHTML('<foo>');
      document.write(html);
      expect(mockWrite).toHaveBeenCalledWith(html);
    });

    it('on window.open', function() {
      enforcer.uninstall();
      const mockOpen = spyOn(window, 'open');
      enforcer.install();
      let url = policy.createURL('/');
      expect(function() {
        window.open(url, 'foo', 'bar');
      }).not.toThrow();
      expect(mockOpen).toHaveBeenCalledWith(url, 'foo', 'bar');
    });

    it('on DOMParser.parseFromString', function() {
      const dom = new DOMParser().parseFromString(
          policy.createHTML('<foo>'), 'text/html');
      expect(dom.body.innerHTML).toContain('<foo>');
    });

    it('independent of String(...)', function() {
      let el = document.createElement('script');

      // String(...) is a common, confusable idiom for converting to a
      // string.
      let originalString = String;
      try {
        try {
          // eslint-disable-next-line no-global-assign
          String = () => EVIL_URL;
        } catch (ex) {
          // Ok if assignment to String fails.
        }
        el.src = policy.createScriptURL(TEST_URL);
      } finally {
        if (String !== originalString) {
          // eslint-disable-next-line no-global-assign
          String = originalString;
        }
      }

      expect(el.src).toEqual(TEST_URL);
    });

    it('independent of valueOf()', function() {
      let el = document.createElement('script');

      // The idiom ('' + obj) actually invokes valueOf first, not toString.
      let originalValueOf = Object.prototype.valueOf;
      try {
        try {
          // eslint-disable-next-line no-extend-native
          Object.prototype.valueOf = () => EVIL_URL;
        } catch (ex) {
          // Ok if assignment to Object.prototype fails.
        }
        el.src = policy.createScriptURL(TEST_URL);
      } finally {
        if (Object.prototype.valueOf !== originalValueOf) {
          // eslint-disable-next-line no-extend-native
          Object.prototype.valueOf = originalValueOf;
        }
      }

      expect(el.src).toEqual(TEST_URL);
    });

    it('on Element.prototype.setAttribute', function() {
      let el = document.createElement('iframe');

      el.setAttribute('src', policy.createURL(TEST_URL));

      expect(el.src).toEqual(TEST_URL);
    });

    it('on Element.prototype.setAttributeNS', function() {
      let el = document.createElement('img');

      // TODO: what about 'http://www.w3.org/1999/xhtml'?
      el.setAttributeNS('http://www.w3.org/1999/xhtml', 'src', policy.createURL(TEST_URL));

      expect(el.getAttributeNS('http://www.w3.org/1999/xhtml', 'src')).toEqual(TEST_URL);
      expect(el.getAttribute('src')).toEqual(TEST_URL);
    });

    it('on object codebase', function() {
      let el = document.createElement('object');

      el.setAttribute('codebase', policy.createScriptURL(TEST_URL));

      expect(el.codeBase).toBe(TEST_URL);
      expect(el.codebase).toBe(undefined);
    });
  });

  describe('enforcement allowed policy names', function() {
    let enforcer;

    afterEach(function() {
      enforcer.uninstall();
    });

    it('is respected on createPolicy', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      'fallback1',
      ['foo']));
      enforcer.install();
      expect(() => TrustedTypes.createPolicy('foo', (p) => {
        p.createHTML = (s) => s;
      })).not.toThrow();
      expect(() => TrustedTypes.createPolicy('bar', (p) => {
        p.createHTML = (s) => s;
      })).toThrow();
    });
  });

  describe('enforcement fallback policy', function() {
    let enforcer;

    afterEach(function() {
      enforcer.uninstall();
    });

    it('is used on strings', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      'fallback1',
      ['*']));
      enforcer.install();
      TrustedTypes.createPolicy('fallback1', (p) => {
        p.createHTML = (s) => 'fallback:' + s;
        p.expose = true;
      });
      let el = document.createElement('div');
      el.innerHTML = TEST_HTML;

      expect(el.innerHTML).toEqual('fallback:' + TEST_HTML);
    });

    it('has to be exposed', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      'fallback10', ['*']));
      enforcer.install();
      TrustedTypes.createPolicy('fallback10', (p) => {
        p.createHTML = (s) => 'fallback:' + s;
      });
      let el = document.createElement('div');
      expect(() => el.innerHTML = TEST_HTML).toThrow();
      expect(el.innerHTML).toEqual('');
    });

    it('is not used on typed values', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      'fallback2', ['*']));
      enforcer.install();
      TrustedTypes.createPolicy('fallback2', (p) => {
        p.createHTML = (s) => 'fallback:' + s;
        p.expose = true;
      });
      const policy = TrustedTypes.createPolicy(Math.random(), noopPolicy);
      let el = document.createElement('div');
      el.innerHTML = policy.createHTML(TEST_HTML);

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('fails when fallback is not installed', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      'fallback3', ['*']));
      enforcer.install();
      TrustedTypes.createPolicy(Math.random(), noopPolicy);
      let el = document.createElement('div');
      expect(() => el.innerHTML = TEST_HTML).toThrowError(TypeError);
      expect(el.innerHTML).toEqual('');
    });
  });

  describe('enforcement does not mix the types', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy(Math.random(), (p) => {
        noopPolicy(p);
        p.expose = true;
      });
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      let el = document.createElement('div');

      expect(() => {
        el.innerHTML = policy.createURL(TEST_URL);
      }).toThrow();

      expect(() => {
        el.innerHTML = policy.createScriptURL(TEST_URL);
      }).toThrow();
      expect(el.innerHTML).toEqual('');
    });

    it('on Element.insertAdjacentHTML', function() {
      let el = document.createElement('div');

      expect(() => {
        el.insertAdjacentHTML('afterbegin', policy.createURL('bar'));
      }).toThrow();

      expect(() => {
        el.insertAdjacentHTML('afterbegin', policy.createScriptURL('foo'));
      }).toThrow();

      expect(el.innerHTML).toEqual('');
    });

    it('on HTMLScriptElement.src', function() {
      let el = document.createElement('script');

      expect(() => {
       el.src = policy.createHTML(TEST_URL);
      }).toThrow();

      expect(() => {
       el.src = policy.createURL(TEST_URL);
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on Element.prototype.setAttribute', function() {
      let el = document.createElement('iframe');

      expect(() => {
       el.src = policy.createHTML(TEST_URL);
      }).toThrow();

      expect(() => {
       el.src = policy.createScriptURL(TEST_URL);
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on HTMLElement innocuous attribute', function() {
      let el = document.createElement('div');

      el.title = policy.createHTML(TEST_URL);
      expect(el.title).toEqual(TEST_URL);

      el.title = policy.createURL(TEST_HTML);
      expect(el.title).toEqual(TEST_HTML);
    });
  });
});
