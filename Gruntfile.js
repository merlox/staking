module.exports = function (grunt) {
  // Project configuration.
  const dist = './dist/';
  const server = './src-admin/server/';
  const common = './src-admin/common/';
  const client = './src-admin/client/';
  const contracts = './build/';

  grunt.initConfig(
    {
      pkg: grunt.file.readJSON('package.json'),
      clean: {dist: [dist, "./migrations/config"]},
      exec: {compile: "truffle compile"},
      copy: {
        main: {
          files: [
            {
              expand: true,
              cwd: client,
              src: ['**/*.html',"**/*.css"],
              dest: dist + "/src-admin/client"
            },
            {
              expand: true,
              cwd: ".",
              src: ["package.json"],
              dest: dist
            },
            {
              expand: true,
              cwd: server,
              src: ['**/*'],
              dest: dist + "/src-admin/server"
            },
            {
              expand: true,
              cwd: 'bower_components',
              src: ['**/*'],
              dest: dist + "/src-admin/client"
            },
            {
              expand: true,
              cwd: contracts,
              src: ['**/*'],
              dest: dist + "/build"
            },
            {
              expand: true,
              cwd: "./config",
              src: ['**/*'],
              dest: "./migrations/config"
            }
          ]
        }
      },
      browserify: {
        dist: {
          files: {
            "dist/src-admin/client/admin.js": client + "admin.js"
          }
        }
      },
      watch: {
        s1: {
          files: [client + "/**"],
          tasks: ['copy', 'browserify']
        }
      }
    });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('default', ['clean', 'exec', 'copy', 'browserify']);
};