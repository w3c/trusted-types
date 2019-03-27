/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */
import {parseSrcset, unparseSrcset} from '../src/utils/srcset.js';

/**
 * @param {*} want
 * @param {*} got
 */
function deepEquals(want, got) {
  expect(JSON.stringify(want)).toEqual(JSON.stringify(got));
}

describe('util/srcset', () => {
  describe('parse', () => {
    it('fails on empty', () => {
      expect(() => parseSrcset('')).toThrow();
      expect(() => parseSrcset('   ')).toThrow();
    });

    it('one url ok', () => {
      deepEquals(
        parseSrcset('/'),
        [{url: '/'}]);
      deepEquals(
        parseSrcset('https://example.com/'),
        [{url: 'https://example.com/'}]);
    });

    it('two urls', () => {
      deepEquals(
        parseSrcset('/url1 123x, /url2'),
        [
          {url: '/url1', metadata: '123x'},
          {url: '/url2'},
        ]);
    });

    it('three', () => {
      deepEquals(
        parseSrcset('/url1 123x, /url2 1.5p, /url3'),
        [
          {url: '/url1', metadata: '123x'},
          {url: '/url2', metadata: '1.5p'},
          {url: '/url3'},
        ]);
    });

    it('leading and trailing spaces', () => {
      deepEquals(
        parseSrcset('  /url1 123x , /url2 1.5p,/url3\n'),
        [
          {url: '/url1', metadata: '123x'},
          {url: '/url2', metadata: '1.5p'},
          {url: '/url3'},
        ]);
    });

    it('trailing commas', () => {
      expect(() => parseSrcset('/url ,')).toThrow();
    });

    it('comma stuck to url', () => {
      expect(() => parseSrcset('/url, /url')).toThrow();
    });

    it('comma stuck to url and metadata ambiguity', () => {
      deepEquals(
        parseSrcset('/url, 123x'),
        [{url: '/url,', metadata: '123x'}]);
      // Also ok if this throws.
    });

    it('bad numbers', () => {
      expect(() => parseSrcset('/ 1.x')).toThrow();
      expect(() => parseSrcset('/ 1.0ex')).toThrow();
      expect(() => parseSrcset('/ 1.0.0x')).toThrow();
      expect(() => parseSrcset('/ +1x')).toThrow();
      expect(() => parseSrcset('/ --1x')).toThrow();
      expect(() => parseSrcset('/ 1.0e+x')).toThrow();
      expect(() => parseSrcset('/ 1.0e+123xx')).toThrow();
      expect(() => parseSrcset('/ 1.0f+123xx')).toThrow();

      expect(
        () =>
          parseSrcset(`/ ${ String.fromCharCode('0'.charCodeAt(0) - 1) }`)
      ).toThrow();

      expect(
        () =>
          parseSrcset(`/ ${ String.fromCharCode('9'.charCodeAt(0) + 1) }`)
      ).toThrow();
    });

    it('nice numbers', () => {
      deepEquals(
        parseSrcset(
          [
            '/ 1',
            '/ -1',
            '/ -1.0',
            '/ -123.456',
            '/ -123.456e1',
            '/ -123.456E1',
            '/ -123.456E-1',
            '/ -123.456E+12',
            '/ -123.456E+12f',
          ].join(' , ')),
        [
          {url: '/', metadata: '1'},
          {url: '/', metadata: '-1'},
          {url: '/', metadata: '-1.0'},
          {url: '/', metadata: '-123.456'},
          {url: '/', metadata: '-123.456e1'},
          {url: '/', metadata: '-123.456E1'},
          {url: '/', metadata: '-123.456E-1'},
          {url: '/', metadata: '-123.456E+12'},
          {url: '/', metadata: '-123.456E+12f'},
        ]);
    });
  });

  describe('unparse', () => {
    it('fails on empty', () => {
      expect(() => unparseSrcset([])).toThrow();
    });

    it('fails on null', () => {
      expect(() => unparseSrcset(null)).toThrow();
    });

    it('one url', () => {
      expect(unparseSrcset([{url: '/url'}])).toEqual('/url');
    });

    it('url with metadata', () => {
      expect(unparseSrcset(
        [
          {url: '/url', metadata: '123x'},
        ])).toEqual('/url 123x');
    });

    it('lots of urls', () => {
      expect(unparseSrcset(
        [
          {url: '/url1', metadata: '123x'},
          {url: '/url2', metadata: '-1.5e3p'},
          {url: '/url3'},
        ])).toEqual('/url1 123x , /url2 -1.5e3p , /url3');
    });

    it('extra stuff', () => {
      expect(unparseSrcset(
        [
          {url: '/url', metadata: '123x', extra: 'don\t mind me'},
        ])).toEqual('/url 123x');
    });

    describe('reject ambiguity', () => {
      it('comma at front', () => {
        expect(() => unparseSrcset([{url: ',url'}])).toThrow();
      });

      it('comma at end', () => {
        expect(() => unparseSrcset([{url: 'url,'}])).toThrow();
      });

      it('comma in middle', () => {
        expect(() => unparseSrcset([{url: 'ur,l'}])).toThrow();
      });

      it('whitespace at front', () => {
        expect(() => unparseSrcset([{url: ' url'}])).toThrow();
      });

      it('whitespace at end', () => {
        expect(() => unparseSrcset([{url: 'url\t'}])).toThrow();
      });

      it('whitespace in middle', () => {
        expect(() => unparseSrcset([{url: 'ur\n123x'}])).toThrow();
      });
    });

    describe('predictable on spooky', () => {
      it('stringifier', () => {
        let callCount = 0;

        expect(unparseSrcset(
          [
            {
              url: {
                toString() {
                  return callCount++ ? ',bar,' : 'foo';
                },
              },
            },
          ]))
          .toEqual('foo');

        expect(callCount).toEqual(1);
      });

      it('array', () => {
        let callCounts = {url: 0, metadata: 0};
        let spookyImageCandidate = new Proxy(
          {},
          {
            get(target, prop) {
              return String(callCounts[prop]++);
            },
          });

        expect(unparseSrcset([spookyImageCandidate])).toEqual('0 0');
        deepEquals(callCounts, {url: 1, metadata: 1});
      });
    });
  });
});