/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'jasmine'],

    files: [
      { pattern: 'tests/**/*_test.js'},
    ],

    exclude: [
      '**/*.swp'
    ],

    preprocessors: {
      'tests/**/*.js': ['browserify'],
    },

    browserify : {
            configure: function browserify(bundle) {
                bundle.once('prebundle', function prebundle() {
                    bundle.transform('babelify', {presets: ['env']});
                });
            }
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['ChromeHeadlessNoSandbox', 'FirefoxHeadlessDev'],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      },
      FirefoxHeadlessDev: {
        base: 'FirefoxHeadless',
        prefs: {
          // Not enabled in release versions.
          // https://developer.mozilla.org/en-US/Firefox/Experimental_features
          'security.csp.enable_violation_events': true,
        }
      }
    },

    singleRun: false,

    concurrency: Infinity
  })
}
