require([
  'dojo/_base/declare',
  'dojo/_base/array',
  'JBrowse/Browser',
  'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot',
  'WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity'
], function (
  declare,
  array,
  Browser,
  SVGXYPlot,
  SVGDensity
) {

  describe('Initalize testing', function () {
    var x = 1;
    it('jasmine function', function () {
      expect(x).toBe(1);
    });
  });

  describe('Initalize track', function () {
    var track = new SVGXYPlot({
      browser: new Browser({
        unitTestMode: true
      }),
      config: {
        urlTemplate: "../data/chip_h3k4me3_test.bw",
        label: "testtrack_xy"
      }
    });
    it('track', function () {
      expect(track)
        .toBeTruthy();
    });
  });

  describe('Initalize SVG track', function () {
    var track = new SVGDensity({
      browser: new Browser({
        unitTestMode: true
      }),
      config: {
        urlTemplate: "../data/chip_h3k4me3_test.bw",
        label: "testtrack_dens"
      }
    });
    it('track', function () {
      expect(track)
        .toBeTruthy();
    });
  });

});
