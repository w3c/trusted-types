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

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'closure'],

    files: [
      { pattern: 'node_modules/google-closure-library/closure/goog/base.js'},
      { pattern: 'tests/**/*_test.js'},
      { pattern: 'src/**/*.js', included: false },
      { pattern: 'node_modules/google-closure-library/closure/goog/deps.js', included: false, served: false },
      { pattern: 'node_modules/google-closure-library/closure/goog/**/*.js', included: false}
    ],

    exclude: [
      '**/*.swp'
    ],

    preprocessors: {
      // tests are preprocessed for dependencies (closure) and for iits
      'tests/**/*.js': ['closure', 'closure-iit'],
      // source files are preprocessed for dependencies
      'src/**/*.js': ['closure'],
      // external deps
      'node_modules/google-closure-library/closure/goog/deps.js': ['closure-deps']
    },

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ['Chrome', 'ChromeHeadless', 'Firefox'],

    singleRun: false,

    concurrency: Infinity
  })
}