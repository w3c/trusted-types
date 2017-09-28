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
goog.require('trustedtypes.TrustedTypesEnforcer');
goog.require('trustedtypes.data.TrustedTypeConfig');
goog.require('trustedtypes.types.TrustedHTML');

describe('TrustedTypesEnforcer', function() {
  let TEST_HTML = '<b>html</b>';

  let TEST_URL = 'http://example.com/script';

  let ENFORCING_CONFIG = new trustedtypes.data.TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true);

  it('requires calling install to enforce', function() {
    let enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
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
    let enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
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
    let enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
    enforcer.install();

    expect(function() {
      enforcer.install();
    }).toThrow();

    enforcer.uninstall();
  });

  it('prevents double uninstallation', function() {
    let enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
    enforcer.install();
    enforcer.uninstall();
    expect(function() {
      enforcer.uninstall();
    }).toThrow();
  });

  describe('enforcement disables string assignments', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
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
  });

  describe('enforcement allows type-based assignments', function() {
    beforeEach(function() {
      enforcer = new trustedtypes.TrustedTypesEnforcer(ENFORCING_CONFIG);
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
  });
});
