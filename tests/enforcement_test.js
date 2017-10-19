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
import {TrustedTypesEnforcer} from '../src/enforcement.js';
import {TrustedHTML} from '../src/types/trustedhtml.js';
import {TrustedURL} from '../src/types/trustedurl.js';
import {TrustedScriptURL} from '../src/types/trustedscripturl.js';

describe('TrustedTypesEnforcer', function() {
  let TEST_HTML = '<b>html</b>';

  let TEST_URL = 'http://example.com/script';

  let ENFORCING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true);

  it('requires calling install to enforce', function() {
    let enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
    let el = document.createElement('div');

    expect(function() {
      el.innerHTML = TEST_HTML;
    }).not.toThrow();

    enforcer.install();
    expect(function() {
      el.innerHTML = TEST_HTML;
    }).toThrowError(TypeError);

    enforcer.uninstall();
  });

  it('allows for uninstalling policies', function() {
    let enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
    let el = document.createElement('div');
    enforcer.install();

    expect(function() {
      el.innerHTML = TEST_HTML;
    }).toThrow();

    expect(function() {
      el.insertAdjacentHTML('afterbegin', TEST_HTML);
    }).toThrow();

    enforcer.uninstall();

    expect(function() {
      el.innerHTML = TEST_HTML;
    }).not.toThrowError(TypeError);

    expect(function() {
      el.insertAdjacentHTML('afterbegin', TEST_HTML);
    }).not.toThrowError(TypeError);
  });

  it('prevents double installation', function() {
    let enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
    enforcer.install();

    expect(function() {
      enforcer.install();
    }).toThrow();

    enforcer.uninstall();
  });

  it('prevents double uninstallation', function() {
    let enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
    enforcer.install();
    enforcer.uninstall();
    expect(function() {
      enforcer.uninstall();
    }).toThrow();
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
    });

    it('on outerHTML', function() {
      let wrap = document.createElement('div');
      let el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = TEST_HTML;
      }).toThrow();
    });

    it('on iframe srcdoc', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.srcdoc = TEST_HTML;
      }).toThrow();
    });

    it('on a href', function() {
      let el = document.createElement('a');

      expect(function() {
        el.href = TEST_URL;
      }).toThrow();
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
      let a = document.createElement('link');
      a.setAttribute('rel', 'stylesheet');
      expect(a.getAttribute('rel')).toEqual('stylesheet');
      expect(a.rel).toEqual('stylesheet');
    });

    it('passes through inert elements', function() {
      let a = document.createElement('section');
      a.setAttribute('id', 'foo');
      expect(a.getAttribute('id')).toEqual('foo');
      expect(a.id).toEqual('foo');
    });
  });

  describe('enforcement allows type-based assignments', function() {
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

      el.innerHTML = TrustedHTML.unsafelyCreate(TEST_HTML);

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('on outerHTML', function() {
      let wrap = document.createElement('div');
      let el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = TrustedHTML.unsafelyCreate(TEST_HTML);
      }).not.toThrow();
    });

    it('on iframe srcdoc', function() {
      let el = document.createElement('iframe');

      expect(function() {
        el.srcdoc = TrustedHTML.unsafelyCreate(TEST_HTML);
      }).not.toThrow();

      expect(el.srcdoc).toEqual(TEST_HTML);
    });

    it('on Range.createContextualFragment', function() {
      let range = document.createRange();

      let fragment = range.createContextualFragment(
          TrustedHTML.unsafelyCreate(TEST_HTML));

      expect(fragment.children[0].outerHTML).toEqual(TEST_HTML);
    });


    it('on Element.insertAdjacentHTML', function() {
      let el = document.createElement('div');

      el.insertAdjacentHTML('afterbegin', TrustedHTML.unsafelyCreate('bar'));
      el.insertAdjacentHTML('afterbegin', TrustedHTML.unsafelyCreate('foo'));

      expect(el.innerHTML).toEqual('foo' + 'bar');
    });

    it('on HTMLScriptElement.src', function() {
      let el = document.createElement('script');

      el.src = TrustedScriptURL.unsafelyCreate(TEST_URL);

      expect(el.src).toEqual(TEST_URL);
    });

    it('on Element.prototype.setAttribute', function() {
      let el = document.createElement('iframe');

      el.setAttribute('src', TrustedURL.unsafelyCreate(TEST_URL));

      expect(el.src).toEqual(TEST_URL);
    });

    it('on object codebase', function() {
      let el = document.createElement('object');

      el.setAttribute('codebase', TrustedScriptURL.unsafelyCreate(TEST_URL));

      expect(el.codeBase).toBe(TEST_URL);
      expect(el.codebase).toBe(undefined);
    });
  });

  describe('template literal interpolation', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('forbids string assignment for node contents', function() {
      expect(function() {
        let one = '1';
        TrustedHTML.fromTemplateLiteral `<b>${one}</b>`;
      }).toThrowError(TypeError);
    });

    it('forbids string assignments for partial node contents', function() {
      expect(function() {
        let one = '1';
        TrustedHTML.fromTemplateLiteral `<b>-${one}-</b>`;
      }).toThrowError(TypeError);
    });

    it('allows TrustedHTML assignment for node contents', function() {
      let one = TrustedHTML.unsafelyCreate('<i>1</i>');
      expect('' + TrustedHTML.fromTemplateLiteral `<b>${one}</b>`).toEqual(
          '<b><i>1</i></b>');
    });

    it('allows TrustedHTML assignment for partial node contents', function() {
      let one = TrustedHTML.unsafelyCreate('<i>1</i>');
      expect('' + TrustedHTML.fromTemplateLiteral `<b># of files: ${one}</b>`)
          .toEqual('<b># of files: <i>1</i></b>');
    });

    it('forbids string assignment to protected attributes', function() {
      expect(function() {
        let src = 'http://bad/';
        TrustedHTML.fromTemplateLiteral `<script src="${src}"></script>`;
      }).toThrowError(TypeError);
    });

    it('allows typed assignments to protected attributes', function() {
      let src = TrustedScriptURL.unsafelyCreate('http://bad/');
      // eslint-disable-next-line max-len      
      expect('' + TrustedHTML.fromTemplateLiteral `<script src="${src}"></script>`)
          .toEqual('<script src="http://bad/"></script>');
    });
  });
});
