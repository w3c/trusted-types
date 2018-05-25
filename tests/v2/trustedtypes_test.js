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
import {TrustedTypes} from '../../src/v2/trustedtypes.js';

describe('v2 TrustedTypes', function() {
  it('needs some tests', function() {
    expect(TrustedTypes).toEqual(TrustedTypes);
    /*
Previous tests.
 var p = TT.createPolicy('prototype', (p) => {
  p.createHTML = (s) => s.replace(/</g, '&lt;');
  return p;
 });

var html = p.createHTML('<script>aaaa</scri'+'pt>')
console.log(html.policy);
console.log(TT.getPolicyNames());
console.log(''+ html);
var html2 = TT.createHTML('prototype', '<script>aaaa</scri'+'pt>')
console.log(html2.policy);
console.log(''+ html2);

console.log(TT.isHTML(html));
console.log(TT.isHTML(html2));

// Value will be undefined, as the object is not in the map.
try {
console.log(':'+(new html.constructor('fake')) + ':')
console.error('should not happen');
} catch (_) {}

// Both html and its proto are frozen.
html.toString = () => 'fake'
console.log(''+html)
html.__proto__.toString = () => 'fake'
console.log(''+html)
try {
  html.__proto__ = {toString: () => 'fake'}
  console.error('should not happen');
} catch (_) {
}
console.log(''+html)
// you can invoke the constructor, but it's not in the map
try {
new html.constructor('fake');
console.error('should not happen');
} catch (_) {
}
     */
  });
});
