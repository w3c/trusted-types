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
import {TrustedScriptURL} from '../../src/types/trustedscripturl.js';
// goog.require('trustedtypes.types.TrustedHTML');

// goog.require('trustedtypes.types.TrustedScriptURL');

describe('TrustedScriptURL', function() {
  describe('unsafelyCreate', function() {
    it('doesn\'t alter absolute url', function() {
      let url = TrustedScriptURL.unsafelyCreate(
          'http://example.org/path/foo=bar?fragment');
      expect('' + url).toEqual('http://example.org/path/foo=bar?fragment');
    });

    it('resolves relative URL', function() {
      let url = TrustedScriptURL.unsafelyCreate('/relative/path');
      let protocol = document.location.protocol;
      let host = document.location.host;
      expect('' + url).toEqual(protocol + '//' + host + '/relative/path');
    });
  });

  it('stringifies', function() {
    let protocol = document.location.protocol;
    let host = document.location.host;
    expect(''+TrustedScriptURL.unsafelyCreate('foo'))
        .toEqual(protocol + '//' + host + '/foo');
  });

  it('has a name', function() {
    expect(TrustedScriptURL.name).toEqual('TrustedScriptURL');
  });
});
