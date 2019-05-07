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

    // global config of your BrowserStack account
    browserStack: {
      username: 'afasfas1',
      project: 'trusted-types-polyfill',
    },

    browserify : {
            configure: function browserify(bundle) {
                bundle.once('prebundle', function prebundle() {
                    bundle.transform('babelify', {
                      presets: ['@babel/preset-env'],
                      sourceMapsAbsolute: true,
                    });
                });
            },
            debug: true,
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['ChromeHeadlessNoSandbox', 'FirefoxHeadlessDev', 'ChromeBrowserStack'],

    customLaunchers: {
      ChromeBrowserStack: {
        base: 'BrowserStack',
        browser: 'chrome',
        os: 'windows',
        os_version: '10',
      },
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--remote-debugging-port=9222'],
        debug: true,
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
