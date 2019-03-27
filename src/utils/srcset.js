/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

const {apply} = Reflect;
const {exec, test} = RegExp.prototype;

/**
 * Given a valid srcset attribute value, returns an array where each element
 * corresponds to an image candidate strings and is an array with a URL in
 * element zero, and may contain image metadata in element one.
 *
 * For example, given "/url0 128w, /url1 1.5x, /url2" it returns
 * [
 *   { url: "/url0", metadata: "128w" },
 *   { url: "/url1", metadata: "1.5x" },
 *   { url: "/url2" }
 * ]
 *
 * @param {string} str
 * @return {!Array<!{ url: string, metadata: (string | undefined) }>}
 * @see https://html.spec.whatwg.org/multipage/images.html#srcset-attribute
 */
export function parseSrcset(str) {
  if (typeof str !== 'string') {
 throw new TypeError(str);
}

  const imageCandidates = [];
  // Unfortunately, we can't regex split on commas because
  // http://example.com?a=b,c is valid as a URL part.
  const tokens = str.split(ASCII_SPACES_RE);

  let i = 0;
  let n = tokens.length;

  if (i < n && !tokens[i]) {
    ++i;
  }
  if (i < n && !tokens[n - 1]) {
    --n;
  }
  if (i >= n) {
    throw new Error('empty srcset');
  }

  while (i < n) {
    const url = tokens[i];
    ++i; // Skip over url

    let metadata = null;
    if (i < n && tokens[i][0] !== ',') {
      metadata = tokens[i];
      const commaIndex = metadata.indexOf(',');
      // Before:  tokens = [ 'url', '123,nexturl ]
      //                            ^--------------- i
      // After:   tokens = [ 'url', ',nexturl ]
      //                            ^--------------- i
      if (commaIndex >= 0) {
        const rest = metadata.substring(commaIndex);
        metadata = metadata.substring(0, commaIndex);
        // Push back content after the comma.
        tokens[i] = rest;
      } else {
        ++i; // Consume metadata token
      }
    }

    if (metadata !== null) {
      requireValidSrcMetadata(metadata);
    }
    // Content checks for URLs are delayed until after policy applicaiton.
    let imageCandidate = {url};
    if (metadata !== null) {
      imageCandidate.metadata = metadata;
    }
    imageCandidates.push(imageCandidate);

    if (i === n) {
      // No comma or excess tokens.
      break;
    }

    const nextToken = tokens[i];
    if (nextToken[0] !== ',') {
      break;
    }
    let strippedToken = nextToken.substring(1);
    if (strippedToken) {
      // Before:  tokens = [ 'url', ',nexturl ]
      //                            ^--------------- i
      // After:   tokens = [ 'url', 'nexturl ]
      //                            ^--------------- i
      tokens[i] = strippedToken;
    } else {
      ++i; // Skip over comma
      if (i === n) {
        throw new Error('expected URL');
      }
    }
  }

  if (i < n) {
    throw new Error(
      `srcset includes unconsumed content: ${ tokens.slice(i).join(' ') }`);
  }

  return imageCandidates;
}

/**
 * Unparses a structured srcset like that returned by parseSrcset.
 * This may throw on inputs that cannot be serialized, including some
 * inputs returned by parseSrcset.
 *
 * @param {!Array<!{ url: string, metadata: (string | undefined) }>}
 *        imageCandidates
 * @return {string}
 */
export function unparseSrcset(imageCandidates) {
  let out = '';
  for (let i = 0, n = imageCandidates.length; i < n; ++i) {
    let {url, metadata} = imageCandidates[i];
    if (i) {
      out += ' , ';
    }
    url = `${ url }`;
    requireEmbeddableUrl(url);
    out += url;
    if (metadata) {
      metadata = `${ metadata }`;
      requireValidSrcMetadata(metadata);
      out += ' ' + metadata;
    }
  }
  if (!out.length) {
    throw new Error('empty srcset');
  }
  return out;
}


// https://infra.spec.whatwg.org/#ascii-whitespace
// ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR,
// or U+0020 SPACE.
// eslint-disable-next-line no-control-regex
const ASCII_SPACES_RE = /[\u0009\u000a\u000c\u000d\u0020]+/;
// https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#floating-point-numbers
// eslint-disable-next-line no-useless-escape
const FLOAT_RE = /^-?(?=[0-9.])[0-9]*(?:[.][0-9]+)?(?:[eE][+\-]?[0-9]+)?$/;
// ASCII_SPACES and commas are all relevant to the structure of a srcset
// eslint-disable-next-line no-control-regex
const METACHARACTER_RE = /[\u0009\u000a\u000c\u000d\u0020,]/;

/**
 * Throws if str is not a valid floating point number string per whatwg/infra.
 * @param {string} str
 * @return {void}
 */
function isValidFloatingPointNumber(str) {
  if (typeof str !== 'string') {
    throw new TypeError(str);
  }
  return apply(test, FLOAT_RE, [str]);
}

/**
 * Throws if str is not a valid image metadata string.
 * @param {string} metadata
 */
function requireValidSrcMetadata(metadata) {
  let numberPart = metadata;
  // Metadata may have a letter after the (integer | float) part.
  // Integers are lexically a subset of floats so just check that it floats.
  const lastIndex = metadata.length - 1;
  if (lastIndex >= 0) {
    const lastCharCode = metadata.charCodeAt(lastIndex) | 32;
    if (97 <= lastCharCode && lastCharCode <= 122) {
      numberPart = numberPart.substring(0, lastIndex);
    }
  }
  if (!isValidFloatingPointNumber(numberPart)) {
    throw new Error(`Invalid srcset metadata ${ metadata }`);
  }
}

/**
 * Throws on URLs that contain srcset meta-characters: ASCII spaces or commas.
 * Also rejects the empty string.
 *
 * @param {string} url
 */
function requireEmbeddableUrl(url) {
  if (!url || apply(exec, METACHARACTER_RE, [url])) {
    throw new Error(`Cannot embed url ${ url } in srcset`);
  }
}
