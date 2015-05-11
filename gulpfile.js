/*global require, process, console */
(function () {
    'use strict';
	
    // Dependencies
    var gulp = require('gulp'),
        sass = require('gulp-sass'),
        plumber = require('gulp-plumber'),
        sourcemaps = require('gulp-sourcemaps'),
        concat = require('gulp-concat'),
        uglify = require('gulp-uglify'),
		rimraf = require('rimraf'),
		karma = require('karma').server;
    
    // Convert SCSS to CSS files
	function scssToCSS() {
        var sassSettings = {
                outputStyle: 'compressed',
                errLogToConsole: true
            },
            plumberSettings = {
                errorHandler: function (error) {
                    console.log("SASS Error: " + error);
                }
            };
        
        return gulp.src('./styles/scss/all.scss')
            .pipe(plumber(plumberSettings))
            .pipe(sourcemaps.init())
            .pipe(sass(sassSettings))
            .pipe(sourcemaps.write())
            .pipe(plumber.stop())
            .pipe(gulp.dest('./styles'));
    }
	
	// Uglify and Concatenate Javascript files
	function jsUglifyAndMinify() {
		var plumberSettings = {
			errorHandler: function (error) {
				console.log("JS Error: " + error);
			}
		};
        
        return gulp.src([
			'./app/**/config.js',
			'./app/**/module.js',
			'./app/**/!(module,config)*.js'
		])
			.pipe(plumber(plumberSettings))
            .pipe(concat('app.min.js'))
            .pipe(gulp.dest('./scripts/'))
            .pipe(uglify())
			.pipe(plumber.stop())
            .pipe(gulp.dest('./scripts/'));
    }
	
	// Test Javascript files locally
	function jsTestLocal(callback) {
		karma.start({
			configFile: __dirname + '/tests/karma.conf.js'
		}, function (exitCode) {
			if (callback) {
				callback(exitCode);
			} else {
				process.exit(exitCode);
			}
		});
	}
	
	// Test Javascript files in CI - upload coverage of tests to Coveralls
	function jsTestCI() {
		karma.start({
			configFile: __dirname + '/tests/karma.conf.js',
			singleRun: true,
			browsers: ['PhantomJS'],
			reporters: ['progress', 'coverage', 'coveralls'],
			preprocessors: {
				'**/*.js': ['coverage']
			},
			coverageReporter: {
				type: 'lcov',
				dir: 'tests/coverage/'
			}
		}, function (exitCode) {
			rimraf('./tests/coverage', function () {
				process.exit(exitCode);
			});
		});
	}
	
    gulp.task('sass', scssToCSS);
    gulp.task('jsMin', jsUglifyAndMinify);
	gulp.task('jsTestLocal', jsTestLocal);
	gulp.task('jsTestCI', jsTestCI);
    
    gulp.task('dev', function () {
		jsTestLocal();
        gulp.watch('./styles/scss/**/*.scss', ['sass']);
        gulp.watch('./app/**/*.js', ['jsMin']);
    });
    
    gulp.task('default', ['dev']);
    gulp.task('ci', ['jsTestCI']);
	
}());