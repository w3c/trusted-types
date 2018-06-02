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
import {TrustedTypeConfig} from '../src/data/trustedtypeconfig.js';
import {TrustedTypesEnforcer} from '../src/enforcer.js';
import {TrustedTypes} from '../src/trustedtypes.js';

describe('TrustedTypesEnforcer', function() {
  let TEST_HTML = '<b>html</b>';

  let TEST_URL = 'http://example.com/script';

  let EVIL_URL = 'http://evil.example.com/script';

  let ENFORCING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true);

  describe('installation', function() {
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

    it('requires calling install to enforce', function() {
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

    it('prevents double installation', function() {
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

    it('prevents double uninstallation', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      enforcer.uninstall();
      expect(function() {
        enforcer.uninstall();
      }).toThrow();
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

    it('on copy attribute crossing types', function() {
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

    it('on DOMParser.parseFromString', function() {
      // TODO(msamuel): do we care about explicit invocations of DOMParser?
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
  });

  describe('enforcement allows type-based assignments', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy(Math.random(), (p) => {
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

  describe('enforcement does not mix the types', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy(Math.random(), (p) => {
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
