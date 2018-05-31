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

var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');

gulp.task('default', ['build']);

var flags = {
  dependency_mode: 'STRICT',
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  language_in: 'ECMASCRIPT6_STRICT',
  language_out: 'ECMASCRIPT5',
  output_wrapper: '(function(){%output%}).call(window);',
  jscomp_warning: ["missingProperties", "visibility"],
  jscomp_error: [
    "missingProvide",
    "missingRequire",
    "accessControls",
    "ambiguousFunctionDecl",
    "checkDebuggerStatement",
    "checkTypes",
    "checkVars",
    "const",
    "constantProperty",
    "duplicate",
    "externsValidation",
    "es5Strict",
    "fileoverviewTags",
    "globalThis",
    "invalidCasts",
    "missingProperties",
    "nonStandardJsDocs",
    "strictModuleDepCheck",
    "suspiciousCode",
    "undefinedNames",
    "undefinedVars",
    "unknownDefines",
    "uselessCode",
    "visibility",
  ]
};

gulp.task('build', ['build.full', 'build.api']);

gulp.task('build.full', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler({
      compilerPath: './node_modules/google-closure-compiler/compiler.jar',
      fileName: 'trustedtypes.api_only.build.js',
      compilerFlags: Object.assign({}, flags,
        {entry_point: 'src/polyfill/api_only.js'})
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build.api', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler({
      compilerPath: './node_modules/google-closure-compiler/compiler.jar',
      fileName: 'trustedtypes.build.js',
      compilerFlags: Object.assign({}, flags,
        {entry_point: 'src/polyfill/full.js'})
    }))
    .pipe(gulp.dest('dist'));
});

