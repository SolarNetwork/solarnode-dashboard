/* global require, module */
var EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  var app = new EmberApp(defaults, {
    sassOptions: {
      includePaths: [
        'bower_components/uikit/scss'
      ]
    }
  });

  app.import('bower_components/uikit/js/uikit.js');
  app.import('bower_components/uikit/js/components/datepicker.js');
  app.import('bower_components/uikit/js/components/form-select.js');
  app.import('bower_components/uikit/fonts/fontawesome-webfont.ttf');
  app.import('bower_components/uikit/fonts/fontawesome-webfont.woff');
  app.import('bower_components/uikit/fonts/fontawesome-webfont.woff2');
  app.import('bower_components/uikit/fonts/FontAwesome.otf');

  app.import('bower_components/spectrum/spectrum.js');
  app.import('bower_components/spectrum/spectrum.css');

  // Use `app.import` to add additional libraries to the generated
  // output files.
  //
  // If you need to use different assets in different
  // environments, specify an object as the first parameter. That
  // object's keys should be the environment name and the values
  // should be the asset to use in that environment.
  //
  // If the library that you are including contains AMD or ES6
  // modules that you would like to import into your application
  // please specify an object with the list of modules as keys
  // along with the exports of each module as its value.

  return app.toTree();
};
