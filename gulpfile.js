'use strict';

//******************************************************************************
//* DEPENDENCIES
//******************************************************************************

// Enable ES6
require('harmonize')();

var gulp = require('gulp'),
    tslint = require('gulp-tslint'),
    tsc = require('gulp-typescript'),
    sourcemaps = require('gulp-sourcemaps'),
    codecov = require('gulp-codecov'),
    typedoc = require('gulp-typedoc'),
    runSequence = require('run-sequence'),
    mocha = require('gulp-mocha'),
    istanbul = require('gulp-istanbul'),
    merge = require('merge2'),
    babel = require('gulp-babel'),
    clean = require('gulp-clean'),
    listfiles = require('gulp-listfiles'),
    ngAnnotate = require('gulp-ng-annotate');

//******************************************************************************
//* LINT
//******************************************************************************
gulp.task('lint', function () {

    return gulp.src([
        'src/**/*.ts',
        'test/**/*.ts',
        '!src/models/**/*.ts'
    ])
        .pipe(tslint())
        .pipe(tslint.report('verbose', { emitError: true }));
});

//******************************************************************************
//* PUBLISH
//******************************************************************************
var pkg = require('./package.json');

var tsDistProject = tsc.createProject('tsconfig.json', { declaration: true, stripInternal: true });

gulp.task('build-dist', function () {
    var tsResult = gulp.src('src/**/*.ts')
        .pipe(tsc(tsDistProject))
        .on('error', function (err) {
            process.exit(1);
        });
    return merge([
        tsResult.js.pipe(babel({ presets: ['es2015-loose', 'stage-3'] }))
            .pipe(gulp.dest('dist/')),
        tsResult.dts.pipe(gulp.dest('dist/')),
    ]);
});

gulp.task('clean-dist', function () {
    return gulp.src('dist', { read: false })
        .pipe(clean());
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
        '!src/models/_models.ts'
    ], { read: false })
        .pipe(listfiles({
            filename: '_models.ts',
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
        .pipe(listfiles({
            filename: 'index.ts',
            prefix: 'export * from \'./',
            postfix: '\';',
            banner: 'import \'./models/_models\';',
            replacements: [{
                pattern: /\.[^/.]+$/,
                replacement: ''
            }]
        }))
        .pipe(gulp.dest('src/'));
});

var tsSrcProject = tsc.createProject('tsconfig.json');

gulp.task('build-src', function () {
    return gulp.src(['src/**/*.ts'], { base: './' })
        .pipe(sourcemaps.init())
        .pipe(tsc(tsSrcProject))
        .on('error', function (err) {
            process.exit(1);
        })
        .js
        .pipe(babel({ presets: ['es2015-loose', 'stage-3'] }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/'));
});

var tsTestProject = tsc.createProject('tsconfig.json', { removeComments: false });

gulp.task('build-test', function () {
    return gulp.src(['test/**/*.ts'], { base: './' })
        .pipe(sourcemaps.init())
        .pipe(tsc(tsTestProject))
        .on('error', function (err) {
            process.exit(1);
        })
        .js
        .pipe(babel({ presets: ['es2015-loose', 'stage-3'] }))
        .pipe(ngAnnotate({ add: true, remove: true, singleQuotes: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('build/'));
});

gulp.task('clean-build', function () {
    return gulp.src('build', { read: false })
        .pipe(clean());
});

gulp.task('mocha', function () {
    return gulp.src([
        'node_modules/reflect-metadata/Reflect.js',
        'build/test/**/*.js'
    ])
        .pipe(mocha({ ui: 'bdd' }))
        .pipe(istanbul.writeReports());
});

gulp.task('istanbul:hook', function () {
    return gulp.src([
        'build/src/**/*.js',
        '!build/src/index.js',
        '!build/src/models/_models.js'])
        // Covering files
        .pipe(istanbul())
        // Force `require` to return covered files
        .pipe(istanbul.hookRequire());
});

gulp.task('cover', function () {
    if (!process.env.CI) return;
    return gulp.src('coverage/**/lcov.info')
        .pipe(codecov());
});

gulp.task('test', function (cb) {
    runSequence('istanbul:hook', 'mocha', 'cover', cb);
});

gulp.task('build', function (cb) {
    runSequence(
        'lint',
        'clean-build',
        'listfiles-model',
        'listfiles-index',
        'build-src',
        'build-test', cb);
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
        .pipe(typedoc({
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
            theme: 'minimal'
        }));
});

//******************************************************************************
//* DEFAULT
//******************************************************************************
gulp.task('default', function (cb) {
    runSequence(
        'build',
        'test',
        'dist',
        cb);
});
