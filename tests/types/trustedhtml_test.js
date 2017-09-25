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
goog.require('trustedtypes.types.TrustedHTML');

describe('TrustedHTML', function() {
  describe('escape', function() {
    it('escapes special characters', function() {
      let escaped = TrustedHTML.escape('<foo><>"\'\u0000');
      expect(''+escaped).toEqual('&lt;foo&gt;&lt;&gt;&quot;&#39;&#0;');
    });
  });

  describe('unsafelyCreate', function() {
    it('leaves special characters intact', function() {
      let escaped = TrustedHTML.unsafelyCreate('<foo><>"\'\u0000');
      expect(''+escaped).toEqual('<foo><>"\'\u0000');
    });
  });

  it('stringifies', function() {
    expect(''+TrustedHTML.unsafelyCreate('foo')).toEqual('foo');
  });

  it('has a name', function() {
    expect(TrustedHTML.name).toEqual('TrustedHTML');
  });
});
