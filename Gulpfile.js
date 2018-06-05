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

function compileSettings(entryPoint, destDir, fileName, languageOut) {
  return {
    compilerPath: './node_modules/google-closure-compiler/compiler.jar',
    fileName: fileName,
    compilerFlags: Object.assign({}, flags, {
      language_out: languageOut,
      entry_point: entryPoint,
      create_source_map: destDir + '/' + fileName + '.map',
      source_map_include_content: null,
      output_wrapper: '(function(){%output%}).call(window);//# sourceMappingURL=' + fileName + '.map'
    }),
    // gulp plugin for the closure-compiler considers any output as a warning, including debug info.
    continueWithWarnings: true
  }
}

var flags = {
  dependency_mode: 'STRICT',
  compilation_level: 'ADVANCED_OPTIMIZATIONS',
  language_in: 'ECMASCRIPT6_STRICT',
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
gulp.task('es6', ['es6.full', 'es6.api']);

gulp.task('build.api', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/api_only.js',
        'dist',
        'trustedtypes.api_only.build.js',
        'ECMASCRIPT5')))
    .pipe(gulp.dest('dist'));
});

gulp.task('build.full', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/full.js',
        'dist',
        'trustedtypes.build.js',
        'ECMASCRIPT5')))
    .pipe(gulp.dest('dist'));
});

gulp.task('es6.api', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/api_only.js',
        'dist/es6',
        'trustedtypes.api_only.build.js',
        'ECMASCRIPT_2017')))
    .pipe(gulp.dest('dist/es6'));
});

gulp.task('es6.full', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/full.js',
        'dist/es6',
        'trustedtypes.build.js',
        'ECMASCRIPT_2017')))
    .pipe(gulp.dest('dist/es6'));
});
