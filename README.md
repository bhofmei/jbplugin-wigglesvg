# Wiggle SVG Plot Plugin
Provides the same visualization as the built in XYPlot and Density plot but renders the
plot using HTML SVG which is better for PDF/SVG screenshots.

## Install

For JBrowse 1.11.6+ in the _JBrowse/plugins_ folder, type:  
``git clone https://github.com/bhofmei/jbplugin-wigglesvg.git WiggleSVGPlotPlugin``

**or**

downloaded the latest release version at [releases](https://github.com/bhofmei/jbplugin-wigglesvg/releases).  
Unzip the downloaded folder, place in _JBrowse/plugins_, and rename the folder _WiggleSVGPlotPlugin_


## Activate
Add this to _jbrowse.conf_ under `[GENERAL]`:

    [ plugins.WiggleSVGPlotPlugin ]
    location = plugins/WiggleSVGPlotPlugin

If that doesn't work, add this to _jbrowse_conf.json_:

    "plugins" : {
        "WiggleSVGPlotPlugin" : { "location" : "plugins/WiggleSVGPlotPlugin" }
    }
    
**DO NOT ADD THE PLUGIN TO BOTH!**
    
**Note**: The plugin location folder can be named differently, i.e. _svgwiggle_, but the plugin ID MUST be `jbplugin-wigglesvg` for the plugin to work correctly.

## Test
Sample data is included in the plugin to test that the plugin is working properly. With `URL` as the URL path to the JBrowse instance, navigate a web browser to `URL/index.html?data=plugins/WiggleSVGPlotPlugin/test/data`.

## Using SVG Wiggle Plots
In general, it is recommended to use XYPlot and Density over the SVGXYPlot and SVGDensity when using the browser.
The main purpose of these SVG tracks are for screenshots. 

Use the same as normal for XYPlot an Density except change `type` to `WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot` or `WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity`.

Currently, masking of SVGXYPlots and SVGDensity do not work.

**Example configuration of SVGXYPlot**
In _trackList.json_,
```
{  
  "key" : "SVG XY Plot",
  "label" : "track_svg_xy",
  "storeClass" : "JBrowse/Store/SeqFeature/BigWig",
  "urlTemplate" : "path/to/bigwig_file.bw",
  "type" : "WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot"
}
```

**Example configuration of SVGDensity**
In _trackList.json_,
```
{  
  "key" : "SVG Density Plot",
  "label" : "track_svg_dens",
  "storeClass" : "JBrowse/Store/SeqFeature/BigWig",
  "urlTemplate" : "path/to/bigwig_file.bw",
  "type" : "WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity"
}
```

## Future plans
- add masking for SVG XY Plot and SVG Density