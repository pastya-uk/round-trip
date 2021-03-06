/* */ 
(function(process) {
  'use strict';
  var gutil = require('gulp-util');
  var jshint = require('gulp-jshint');
  var stylish = require('jshint-stylish');
  var path = require('path');
  var Server = require('karma').Server;
  var reporter = require('./helpers/reporter');
  module.exports = function(gulp, config) {
    gulp.task('jshint', function() {
      var paths = config.paths;
      return gulp.src(paths.scripts, {cwd: paths.cwd}).pipe(jshint()).pipe(jshint.reporter(stylish));
    });
    var testTimezone = '';
    gulp.task('karma:unit', gulp.series('ng:test/templates', function(done) {
      if (testTimezone) {
        gutil.log('Setting timezone to "%s"', testTimezone);
        process.env.TZ = testTimezone;
      }
      new Server({
        configFile: path.join(config.dirname, 'test/karma.conf.js'),
        browsers: ['PhantomJS'],
        reporters: ['dots'],
        singleRun: true
      }, function(code) {
        gutil.log('Karma has exited with ' + code);
        done();
      }).start();
    }));
    gulp.task('karma:server', gulp.series('ng:test/templates', function karmaServer(done) {
      new Server({
        configFile: path.join(config.dirname, 'test/karma.conf.js'),
        browsers: ['PhantomJS'],
        reporters: ['progress'],
        autoWatch: true,
        singleRun: false
      }, function(code) {
        gutil.log('Karma has exited with ' + code);
        done();
      }).start();
    }));
    gulp.task('karma:travis', gulp.series('ng:test/templates', function karmaTravis(done) {
      new Server({
        configFile: path.join(config.dirname, 'test/karma.conf.js'),
        browsers: ['PhantomJS'],
        reporters: ['dots', 'coverage'],
        singleRun: true
      }, function(code) {
        gutil.log('Karma has exited with ' + code);
        var token = process.env.CODE_CLIMATE_TOKEN;
        if (!token) {
          done();
          return;
        }
        gulp.src('test/coverage/**/lcov.info', {read: false}).pipe(reporter({token: token})).on('end', done);
      }).start();
    }));
    gulp.task('karma:travis~1.2.0', gulp.series('ng:test/templates', function karmaTravis120(done) {
      new Server({
        configFile: path.join(config.dirname, 'test/~1.2.0/karma.conf.js'),
        browsers: ['PhantomJS'],
        reporters: ['dots'],
        singleRun: true
      }, function(code) {
        gutil.log('Karma has exited with ' + code);
        done();
      }).start();
    }));
    gulp.task('karma:travis~1.3.0', gulp.series('ng:test/templates', function karmaTravis130(done) {
      new Server({
        configFile: path.join(config.dirname, 'test/~1.3.0/karma.conf.js'),
        browsers: ['PhantomJS'],
        reporters: ['dots'],
        singleRun: true
      }, function(code) {
        gutil.log('Karma has exited with ' + code);
        done();
      }).start();
    }));
    gulp.task('test', gulp.series('ng:test/templates', gulp.parallel('jshint', 'karma:unit')));
    gulp.task('test:timezone', function() {
      var timezone = process.argv[3] || '';
      testTimezone = timezone.replace(/-/g, '');
      return gulp.series('ng:test/templates', gulp.parallel('jshint', 'karma:unit'));
    });
    gulp.task('test:server', gulp.series('ng:test/templates', 'karma:server'));
  };
})(require('process'));
