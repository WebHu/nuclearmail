var autoprefix = require('gulp-autoprefixer');
var browserify = require('browserify');
var concat = require('gulp-concat');
var del = require('del');
var gulp = require('gulp');
var less = require('gulp-less');
var reactify = require('reactify');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var watchify = require('watchify');
var webserver = require('gulp-webserver');

gulp.task('clean', function(cb) {
  del(['build'], cb);
});

gulp.task('styles', [], function() {
  return gulp.src('./style/*.less')
    .pipe(sourcemaps.init())
    .pipe(less())
    .on('error', swallowError)
    .pipe(autoprefix())
    .pipe(concat('app.css'))
    .pipe(size())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build'));
});

function scripts(isWatchingEnabled) {
  var bundler, rebundle;
  bundler = browserify({
    entries: ['./App.js'],
    debug: true,
    insertGlobals: true,
    cache: {}, // required for watchify
    packageCache: {}, // required for watchify
    fullPaths: isWatchingEnabled // required to be true only for watchify
  });

  if (isWatchingEnabled) {
    bundler = watchify(bundler);
  }

  bundler.transform(function(file) { return reactify(file, {es6: true}); });

  rebundle = function() {
    return bundler.bundle({debug: true})
      .pipe(source('app.js'))
      .pipe(gulp.dest('build'));
  };

  bundler.on('update', rebundle);
  bundler.on('log', console.log);
  return rebundle();
}

gulp.task('scripts', [], function() {
  return scripts(false);
});

gulp.task('scriptsWatch', [], function() {
  return scripts(true);
});

gulp.task('watch', ['build', 'scriptsWatch'], function () {
  watch({glob: 'style/*.less'}, function() {
    gulp.start('styles');
  });
});

gulp.task('webserver', function() {
  gulp.src('.')
    .pipe(webserver({
      fallback: 'index.html'
    }));
});

gulp.task('build', ['styles', 'scripts']);

gulp.task('default', ['watch', 'webserver']);

function swallowError(error) {
  console.log(error.toString());
  this.emit('end');
}
