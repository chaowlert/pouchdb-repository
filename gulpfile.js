'use strict';

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

// Enable ES6
require('harmonize')();

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    merge = require('merge2'),
    path = require('path'),
    remapIstanbul = require('remap-istanbul/lib/gulpRemapIstanbul'),
    runSequence = require('run-sequence');

//******************************************************************************
//* LINT
//******************************************************************************
gulp.task('lint', function () {

    return gulp.src([
        'src/**/*.ts',
        'test/**/*.ts',
        '!src/models/**/*.ts'
    ])
        .pipe($.tslint({ formatter: 'verbose' }))
        .pipe($.tslint.report({ emitError: true }));
});

//******************************************************************************
//* PUBLISH
//******************************************************************************
var pkg = require('./package.json');

var tsDistProject = $.typescript.createProject('tsconfig.json', {
    target: 'es5',
    declaration: true,
    stripInternal: true,
});

gulp.task('build-dist', function () {
    var tsResult = gulp.src('src/**/*.ts')
        .pipe(tsDistProject())
        .on('error', function (err) {
            process.exit(1);
        });
    return merge([
        tsResult.js.pipe(gulp.dest('dist/')),
        tsResult.dts.pipe(gulp.dest('dist/')),
    ]);
});

gulp.task('clean-dist', function () {
    return gulp.src('dist', { read: false })
        .pipe($.clean());
});

gulp.task('dist', function (cb) {
    runSequence(
        'clean-dist',
        'build-dist',
        cb);
});

//******************************************************************************
//* TESTS
//******************************************************************************

gulp.task('listfiles-model', function () {
    return gulp.src([
        'src/models/**.ts',
        '!src/models/index.ts'
    ], { read: false })
        .pipe($.listfiles({
            filename: 'index.ts',
            prefix: 'import \'./',
            postfix: '\';',
            replacements: [{
                pattern: /\.[^/.]+$/,
                replacement: ''
            }]
        }))
        .pipe(gulp.dest('src/models'));
});

gulp.task('listfiles-index', function () {
    return gulp.src([
        'src/**/*.ts',
        '!src/index.ts',
        '!src/models/**.ts'
    ], { read: false })
        .pipe($.listfiles({
            filename: 'index.ts',
            prefix: 'export * from \'./',
            postfix: '\';',
            banner: 'import \'./models/index\';',
            replacements: [{
                pattern: /\.[^/.]+$/,
                replacement: ''
            }]
        }))
        .pipe(gulp.dest('src/'));
});

var tsSrcProject = $.typescript.createProject('tsconfig.json', {
    target: 'es5',
});

gulp.task('build-src', function () {
    return gulp.src(['src/**/*.ts'], { base: './' })
        .pipe($.sourcemaps.init())
        .pipe(tsSrcProject())
        .on('error', function (err) {
            process.exit(1);
        })
        .js
        .pipe($.sourcemaps.write('./', { includeContent: false }))
        .pipe(gulp.dest('build/'));
});

var tsTestProject = $.typescript.createProject('tsconfig.json', {
    target: 'es5',
    removeComments: false,
});

gulp.task('build-test', function () {
    return gulp.src(['test/**/*.ts'], { base: './' })
        .pipe(tsTestProject())
        .on('error', function (err) {
            process.exit(1);
        })
        .js
        .pipe(gulp.dest('build/'));
});

gulp.task('clean-build', function () {
    return gulp.src('build', { read: false })
        .pipe($.clean());
});

gulp.task('mocha', function () {
    return gulp.src([
        'node_modules/reflect-metadata/Reflect.js',
        'build/test/**/*.js'
    ])
        .pipe($.mocha({ ui: 'bdd' }))
        .pipe($.istanbul.writeReports({
            reporters: ['json'],
            coverageVariable: '__coverage__'
        }));
});

gulp.task('istanbul:hook', function () {
    return gulp.src([
        'build/src/**/*.js',
        '!build/src/index.js',
        '!build/src/models/**.js'], { base: './' })
        // Covering files
        .pipe($.istanbul({
            coverageVariable: '__coverage__',
            preserveComments: true,
            noCompact: true,
            noAutoWrap: true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('remap-istanbul', function () {
    return gulp.src('coverage/coverage-final.json')
        .pipe(remapIstanbul({
            basePath: path.resolve(__dirname, './build')
        }))
        .pipe($.istanbulReport({
            dir: './coverage',
            reporters: ['lcov', 'json', 'text', 'text-summary']
        }));
});

gulp.task('prepare', function(cb) {
    runSequence(
        'lint',
        'clean-build',
        'listfiles-model',
        'listfiles-index',
        cb);
});

gulp.task('test', function (cb) {
    runSequence(
        'prepare',
        'build-src',
        'istanbul:hook',
        'build-test',
        'mocha',
        'remap-istanbul',
        cb);
});

gulp.task('build', function (cb) {
    runSequence(
        'prepare',
        'build-src',
        'build-test',
        cb);
});

//******************************************************************************
//* DOCS
//******************************************************************************
gulp.task('document', function () {
    return gulp
        .src([
            'src/**/**.ts',
            'typings/index.d.ts'
        ])
        .pipe($.typedoc({
            // TypeScript options (see typescript docs)
            target: 'es6',
            module: 'commonjs',
            moduleResolution: 'node',
            isolatedModules: false,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            noImplicitAny: true,
            noLib: false,
            preserveConstEnums: true,
            suppressImplicitAnyIndexErrors: true,
            // Output options (see typedoc docs)
            out: './docs',
            name: pkg.name,
            version: true,
            //theme: 'minimal'
        }));
});

//******************************************************************************
//* DEFAULT
//******************************************************************************
gulp.task('default', ['test']);

gulp.task('prepublish', function (cb) {
    runSequence(
        'default',
        'dist',
        cb);
});