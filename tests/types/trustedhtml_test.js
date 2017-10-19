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
import {TrustedHTML} from '../../src/types/trustedhtml.js';

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

  describe('fromTemplateLiteral', function() {
    it('works', function() {
      let s = TrustedHTML.fromTemplateLiteral `<b>safe</b>`;
      expect(s instanceof TrustedHTML).toBe(true);
      expect('' + s).toEqual('<b>safe</b>');
    });
    it('expects TrustedHTML in node contents', function() {
      let one = '1';
      expect(function() {
        TrustedHTML.fromTemplateLiteral `<b>${one}</b>`;
      }).toThrowError(TypeError);
    });
    it('interpolates in node contents', function() {
      let one = TrustedHTML.unsafelyCreate('1');
      let two = TrustedHTML.unsafelyCreate('2');
      expect('' + TrustedHTML.fromTemplateLiteral `<b>${one}</b>`)
          .toEqual('<b>1</b>');
      expect('' + TrustedHTML.fromTemplateLiteral `<b>${one}</b>${two}`)
          .toEqual('<b>1</b>2');
    });
    it('interpolates multiple times', function() {
      let one = TrustedHTML.unsafelyCreate('1');
      // eslint-disable-next-line max-len
      expect('' + TrustedHTML.fromTemplateLiteral `${one}<b>${one}${one}</b>${one}`)
          .toEqual('1<b>11</b>1');
    });
    it('interpolates full attribute values', function() {
      let one = '1';
      let two = '2';
      // eslint-disable-next-line max-len
      expect('' + TrustedHTML.fromTemplateLiteral `<b id="${one}" class="${two}"></b>`)
          .toEqual('<b id="1" class="2"></b>');
    });
    it('does not interpolates partial attribute values', function() {
      let one = '1';
      let two = '2';
      // eslint-disable-next-line max-len
      expect('' + TrustedHTML.fromTemplateLiteral `<b id="a${one}b" class="${two}"></b>`)
          .toEqual('<b id="1" class="2"></b>');
    });

    it('preserves the types', function() {
      let one = TrustedHTML.unsafelyCreate('<i>nested</i>');
      expect('' + TrustedHTML.fromTemplateLiteral `<b>${one}</b>`)
          .toEqual('<b><i>nested</i></b>');
    });
  });
});
