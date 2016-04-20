var gulp = require('gulp');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var cleancss = require('gulp-clean-css');
var gulpIf = require('gulp-if');
var react = require('gulp-react');
var del = require('del');
var nodemon = require('gulp-nodemon');

gulp.task('useref', ['transpile'], function() {
    return gulp.src('public/*.html')
      .pipe(useref())
      .pipe(gulpIf('*.js', uglify()))
      .pipe(gulpIf('*.css', cleancss({keepSpecialComments : 0})))
      .pipe(gulp.dest('dist/public'))
});

gulp.task('transpile', function () {
    return gulp.src('public/src/homeTemp.jsx')
      .pipe(react())
      .pipe(gulp.dest('public/js'))
});

gulp.task('images', function() {
    return gulp.src('public/images/**/*')
      .pipe(gulp.dest('dist/public/images'))
});

gulp.task('mobile', function () {
    return gulp.src('public/mobile/**/*')
      .pipe(gulp.dest('dist/public/mobile'))
});

gulp.task('app', function () {
    return gulp.src('*')
      .pipe(gulpIf('index.js', gulp.dest('dist')))
      .pipe(gulpIf('package.json', gulp.dest('dist')))
      .pipe(gulpIf('mongoServer.json', gulp.dest('dist')))
      .pipe(gulpIf('currentTempsServer.json', gulp.dest('dist')))
});

gulp.task('clean:dist', function() {
    return del.sync('dist');
});

gulp.task('build', ['useref', 'images', 'mobile', 'app']);

gulp.task('default', ['transpile'], function () {
    nodemon({
        script: 'index.js',
        ext: 'js jsx',
        ignore: ['gulpfile.js', 'public/js/'],
        tasks: ['transpile']
    });
});