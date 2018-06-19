/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

var gulp = require('gulp');
var closureCompiler = require('gulp-closure-compiler');

gulp.task('default', ['es5']);

function compileSettings(entryPoint, destDir, fileName, languageOut) {
  return {
    compilerPath: './node_modules/google-closure-compiler/compiler.jar',
    fileName: fileName,
    compilerFlags: Object.assign({}, flags, {
      language_out: languageOut,
      entry_point: entryPoint,
      create_source_map: destDir + '/' + fileName + '.map',
      source_map_include_content: null,
      output_wrapper: '(function(){%output%}).call(window);//# sourceMappingURL=' + fileName + '.map',
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

gulp.task('es5', ['es5.full', 'es5.api']);
gulp.task('es6', ['es6.full', 'es6.api']);

gulp.task('es5.api', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/api_only.js',
        'dist/es5',
        'trustedtypes.api_only.build.js',
        'ECMASCRIPT5')))
    .pipe(gulp.dest('dist/es5'));
});

gulp.task('es5.full', function() {
  return gulp.src([
      'src/**/*.js',
    ])
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/full.js',
        'dist/es5',
        'trustedtypes.build.js',
        'ECMASCRIPT5')))
    .pipe(gulp.dest('dist/es5'));
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
