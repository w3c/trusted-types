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
// goog.require('trustedtypes.types.TrustedURL');

import {TrustedURL} from '../../src/types/trustedurl.js';

describe('TrustedURL', function() {
  describe('create', function() {
    it('creates about:invalid for non-HTTP URLs', function() {
      let url1 = TrustedURL.create('javascript:alert(1)');
      let url2 = TrustedURL.create('data:text/html,Hi');
      let url3 = TrustedURL.create('fooo:bar');

      expect('' + url1).toEqual('about:invalid');
      expect('' + url2).toEqual('about:invalid');
      expect('' + url3).toEqual('about:invalid');
    });

    it('leaves HTTP URLs intact', function() {
      let url1 = TrustedURL.create('http://example.org/');
      let url2 = TrustedURL.create('https://example.org/');

      expect('' + url1).toEqual('http://example.org/');
      expect('' + url2).toEqual('https://example.org/');
    });

    it('resolves relative URL', function() {
      let url = TrustedURL.create('/relative/path');
      let protocol = document.location.protocol;
      let host = document.location.host;
      expect('' + url).toEqual(protocol + '//' + host + '/relative/path');
    });
  });

  describe('unsafelyCreate', function() {
    it('doesn\'t alter absolute url', function() {
      let url = TrustedURL.unsafelyCreate(
          'http://example.org/path/foo=bar?fragment');
      expect('' + url).toEqual('http://example.org/path/foo=bar?fragment');
    });

    it('resolves relative URL', function() {
      let url = TrustedURL.unsafelyCreate('/relative/path');
      let protocol = document.location.protocol;
      let host = document.location.host;
      expect('' + url).toEqual(protocol + '//' + host + '/relative/path');
    });
  });

  it('stringifies', function() {
    let protocol = document.location.protocol;
    let host = document.location.host;
    expect(''+TrustedURL.unsafelyCreate('foo'))
        .toEqual(protocol + '//' + host + '/foo');
  });

  it('has a name', function() {
    expect(TrustedURL.name).toEqual('TrustedURL');
  });
});
