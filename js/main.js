define([
    'dojo/_base/declare',
    'JBrowse/Plugin',
  'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot',
  'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity'
  ],
  function (
    declare,
    JBrowsePlugin,
     SVGXYPlot,
     SVGDensity
  ) {
    return declare(JBrowsePlugin, {
      constructor: function (args) {
        var browser = args.browser;

        // do anything you need to initialize your plugin here
        this.config.version = 'v1.0.2';
        console.log("WiggleSVGPlotPlugin plugin starting - " + this.config.version);
      }
    });
  });
