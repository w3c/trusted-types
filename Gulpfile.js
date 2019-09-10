/* eslint-disable require-jsdoc */
/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

var path = require('path');
var gulp = require('gulp');
var bikeshed = require('bikeshed-js');
var sizereport = require('gulp-sizereport');
var closureCompiler = require('google-closure-compiler').gulp();
var sourcemaps = require('gulp-sourcemaps');

function compileSettings(entryPoint, fileName, languageOut) {
  return Object.assign({}, flags, {
      js_output_file: fileName,
      language_out: languageOut,
      entry_point: entryPoint,
    });
}

var flags = {
  dependency_mode: 'STRICT',
  isolation_mode: 'IIFE',
  strict_mode_input: null,
  compilation_level: 'ADVANCED',
  language_in: 'ECMASCRIPT6_STRICT',
  jscomp_warning: [],
  jscomp_error: [
    "accessControls",
    "ambiguousFunctionDecl",
    "checkDebuggerStatement",
    "checkPrototypalTypes",
    "checkRegExp",
    "checkTypes",
    "checkVars",
    "conformanceViolations",
    "const",
    "constantProperty",
    "deprecated",
    "deprecatedAnnotations",
    "duplicate",
    "duplicateMessage",
    "es3",
    "es5Strict",
    "externsValidation",
    "fileoverviewTags",
    "functionParams",
    "globalThis",
    "internetExplorerChecks",
    "invalidCasts",
    "misplacedTypeAnnotation",
    "missingGetCssName",
    "missingOverride",
    "missingPolyfill",
    "missingProperties",
    "missingProvide",
    "missingRequire",
    "missingReturn",
//  "missingSourcesWarnings", // Implies reportUnknownTypes.
    "moduleLoad",
    "msgDescriptions",
    "newCheckTypes",
    "nonStandardJsDocs",
//  "reportUnknownTypes", // Too many "could not determine the type of this expression" errors
    "strictCheckTypes",
    "strictMissingProperties",
    "strictMissingRequire",
    "strictModuleDepCheck",
    "strictPrimitiveOperators",
    "suspiciousCode",
    "tooManyTypeParams",
    "typeInvalidation",
    "undefinedNames",
    "undefinedVars",
    "underscore",
    "unknownDefines",
    "unusedLocalVariables",
    "unusedPrivateMembers",
    "useOfGoogBase",
    "uselessCode",
    "visibility",
  ],
  use_types_for_optimization: null,
  assume_function_wrapper: null,
};

gulp.task('es5.api', function() {
  return gulp.src([
      './src/**/*.js',
    ], {base: './'})
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(
      compileSettings(
        './src/polyfill/api_only.js',
        'trustedtypes.api_only.build.js',
        'ECMASCRIPT5')))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/es5'));
});

gulp.task('es5.full', function(done) {
  return gulp.src([
    './src/**/*.js',
  ], {base: './'})
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/full.js',
        'trustedtypes.build.js',
        'ECMASCRIPT5')))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/es5'));
});

gulp.task('es6.api', function() {
  return gulp.src([
    './src/**/*.js',
  ], {base: './'})
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/api_only.js',
        'trustedtypes.api_only.build.js',
        'ECMASCRIPT_2017')))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/es6'));
});

gulp.task('es6.full', function() {
  return gulp.src([
    './src/**/*.js',
  ], {base: './'})
    .pipe(sourcemaps.init())
    .pipe(closureCompiler(
      compileSettings(
        'src/polyfill/full.js',
        'trustedtypes.build.js',
        'ECMASCRIPT_2017')))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/es6'));
});

gulp.task('spec', function() {
  return bikeshed('spec/index.bs', 'dist/spec/index.html');
});

gulp.task('spec.watch', function() {
  const watcher = gulp.watch('spec/**\/*.bs');
  watcher.on('change', (bspath) => {
    const reldir = path.relative(__dirname, path.dirname(bspath));
    const outfile = path.join(
        __dirname,
        'dist',
        reldir,
        `${ path.basename(bspath, '.bs') }.html`);
    bikeshed(bspath, outfile);
  });
});


gulp.task('sizereport', function() {
  return gulp.src('./dist/es*/*.js')
      .pipe(sizereport({gzip: true}));
});

gulp.task('es5', gulp.parallel('es5.full', 'es5.api'));
gulp.task('es6', gulp.parallel('es6.full', 'es6.api'));
gulp.task('default', gulp.series('es5'));
