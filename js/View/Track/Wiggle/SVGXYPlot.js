define('WiggleSVGPlotPlugin/View/Track/Wiggle/SVGXYPlot', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/colors',
    'dojox/gfx',
    'dojo/dom-construct',
    'JBrowse/View/Track/Wiggle/XYPlot'
  ],
  function (
    declare,
    lang,
    array,
    Color,
    dojoColor,
    gfx,
    domConstruct,
    XYPlot
  ) {
    var SVGXYPlot = declare([XYPlot],

      {
        renderBlock: function (args) {
          var block = args.block;

          // don't render this block again if we have already rendered
          // it with this scaling scheme
          if (!this.scaling.compare(block.scaling) || !block.pixelScores)
            return;

          block.scaling = this.scaling;

          domConstruct.empty(block.domNode);

          var features = block.features;
          var featureRects = block.featureRects;
          var dataScale = this.scaling;
          var canvasHeight = this._canvasHeight();
          var canvasWidth = this._canvasWidth(block);

          var c = gfx.createSurface(block.domNode, canvasWidth, canvasHeight);

          c.startBase = block.startBase;
          c.height = canvasHeight;
          block.canvas = c;

          //Calculate the score for each pixel in the block
          var pixels = this._calculatePixelScores(canvasWidth, features, featureRects);


          this._draw(block.scale, block.startBase,
            block.endBase, block,
            c, features,
            featureRects, dataScale,
            pixels, block.maskingSpans); // note: spans may be undefined.

          this.heightUpdate(c.height, args.blockIndex);
          if (!(c.rawNode.parentNode && c.rawNode.parentNode.parentNode)) {
            var blockWidth = block.endBase - block.startBase;

            c.rawNode.style.position = "absolute";
            c.rawNode.style.left = (100 * ((c.startBase - block.startBase) / blockWidth)) + "%";
            switch (this.config.align) {
              case "top":
                c.rawNode.style.top = "0px";
                break;
              case "bottom":
                /* fall through */
              default:
                c.rawNode.style.bottom = this.trackPadding + "px";
                break;
            }
          }
        },
        _preDraw: function(scale, leftBase, rightBase, block, canvas, features, featureRects, dataScale) {
          // fill in background if necessary
          var bgColor = this.getConf('style.bg_color');
          if (bgColor) {
            // add rectangle for block
            var dim = canvas.getDimensions();
            canvas.createRect({
                x: 0,
                y: 0,
                height: dim.height,
                width: dim.width
              })
              .getFill(bgColor);
          }
        },

        _drawFeatures: function (scale, leftBase, rightBase, block, canvas, pixels, dataScale) {
          var thisB = this;
          var dim = canvas.getDimensions();
          var canvasHeight = dim.height;
          var canvasWidth = dim.width;

          var toY = lang.hitch(this, function (val) {
            return canvasHeight * (1 - dataScale.normalize(val));
          });
          var originY = toY(dataScale.origin);

          var disableClipMarkers = this.config.disable_clip_markers;
          var plusList = [{
            x: 0,
            y: originY
          }];
          var minusList = [{
            x: 0,
            y: originY
          }];
          block.clipRects = [];

          array.forEach(pixels, function (p, i) {
            if (!p)
              return;
            var score = toY(p['score']);
            var f = p['feat'];

            if (score <= originY) {
              // bar goes upward -> add to pos list and check minus list
              var top = Math.max(score, 0);
              // check last position
              var lastPlus = plusList[plusList.length - 1];
              var lastMinus = minusList[minusList.length - 1];
              if (lastPlus.y === top) {
                // check to update clip marker
                if (!disableClipMarkers && score < 0) {
                  block.clipRects[block.clipRects.length - 1].width++;
                }
              } else {
                // add this to the lists
                if (lastPlus.x != i) {
                  plusList.push({
                    x: i,
                    y: lastPlus.y
                  });
                }
                plusList.push({
                  x: i,
                  y: top
                });
                // check clip marker
                if (!disableClipMarkers && score < 0) {
                  block.clipRects.push({
                    x: i,
                    y: 0,
                    width: 1,
                    height: 3,
                    fill: this.getConfForFeature('style.clip_marker_color', f) || this.getConfForFeature('style.minus_color', f)
                  });
                }
                // check minus list
                if (lastMinus.y != originY) {
                  minusList.push({
                    x: i,
                    y: originY
                  });
                }
              }
            } else {
              // bar goes downward -> add to minus list and check pos list
              var top = Math.min(score, canvasHeight);
              // check last positions
              var lastPlus = plusList[plusList.length - 1];
              var lastMinus = minusList[minusList.length - 1];
              if (lastMinus.y === top) {
                // check update clip marker
                if (!disableClipMarkers && score > canvasHeight) {
                  block.clipRects[block.clipRects.length - 1].width++;
                }
              } else {
                // add to lists
                if (lastMinus.x !== i) {
                  minusList.push({
                    x: i,
                    y: lastMinus.y
                  });
                }
                minusList.push({
                  x: i,
                  y: top
                });
                // check clip marker
                if (!disableClipMarkers && score > canvasHeight) {
                  block.clipRects.push({
                    x: i,
                    y: canvas - 3,
                    width: 1,
                    height: 3,
                    fill: this.getConfForFeature('style.clip_marker_color', f) || this.getConfForFeature('style.plus_color', f)
                  });
                }
                // check plus features
                if (lastPlus.y != originY) {
                  plusList.push({
                    x: i,
                    y: originY
                  });
                }
              }
            }
          }, this);
          // check close lines
          var lastPlus = plusList[plusList.length - 1];
          var lastMinus = minusList[minusList.length - 1];
          if (lastPlus.x !== canvasWidth && lastPlus.y !== originY) {
            plusList.push({
              x: canvasWidth,
              y: lastPlus.y
            });
          }
          if (lastMinus.x !== canvasWidth && lastMinus.y !== originY) {
            minusList.push({
              x: canvasWidth,
              y: lastMinus.y
            })
          }
          // close lines at origin
          plusList.push({
            x: canvasWidth,
            y: originY
          });
          minusList.push({
            x: canvasWidth,
            y: originY
          });

          // if no fill, remove first and last positions
          if (thisB.config.noFill) {
            plusList = plusList.slice(1, plusList.length - 1);
            minusList = minusList.slice(1, minusList.length - 1);
          }
          // do the drawing
          // create plus
          if (plusList.length > 2) {
            var plusLine = canvas.createPolyline()
              .setShape(plusList)
              .setStroke(thisB.config.style.pos_color);
            if (!thisB.config.noFill) {
              plusLine.setFill(thisB.config.style.pos_color);
            }
            // save to block
            block.plusLine = plusLine;
          }
          // create minus
          if (minusList.length > 2) {
            var minusLine = canvas.createPolyline()
              .setShape(minusList)
              .setStroke(thisB.config.style.neg_color);
            if (!thisB.config.noFill) {
              minusLine.setFill(thisB.config.style.neg_color);
            }
            block.minusLine = minusLine;
          }
        },

        /* If it's a boolean track, mask accordingly */
        _maskBySpans: function (scale, leftBase, rightBase, block, canvas, pixels, dataScale, spans) {
          // does not work currently
        },

        /**
         * Draw anything needed after the features are drawn.
         */
        _postDraw: function (scale, leftBase, rightBase, block, canvas, features, featureRects, dataScale) {
          var dim = canvas.getDimensions();
          var canvasHeight = dim.height;
          var canvasWidth = dim.width;


          var toY = lang.hitch(this, function (val) {
            return canvasHeight * (1 - dataScale.normalize(val));
          });
          var thisB = this;

          // draw the variance_band if requested
          if (this.config.variance_band) {
            var bandPositions =
              typeof this.config.variance_band == 'object' ?
              array.map(this.config.variance_band, function (v) {
                return parseFloat(v);
              })
              .sort()
              .reverse() : [2, 1];
            this.getGlobalStats(lang.hitch(this, function (stats) {
              if (('scoreMean' in stats) && ('scoreStdDev' in stats)) {
                var drawVarianceBand = function (plusminus, fill, label) {
                  var varTop = toY(stats.scoreMean + plusminus);
                  var varHeight = toY(stats.scoreMean - plusminus) - varTop;
                  varHeight = Math.max(1, varHeight);
                  canvas.createRect({
                      x: 0,
                      y: varTop,
                      height: varHeight,
                      width: canvasWidth
                    })
                    .setFill(fill);
                  var fontStyle = {
                    family: 'sans-serif',
                    size: '12px'
                  };
                  if (plusminus > 0) {
                    canvas.createText({
                        x: 2,
                        y: varTop,
                        text: '+' + label,
                        align: 'start'
                      })
                      .setFont(fontStyle);
                    canvas.createText({
                        x: 2,
                        y: varTop + varHeight,
                        text: '-' + label,
                        align: 'start'
                      })
                      .setFont(fontStyle);
                  } else {
                    canvas.createText({
                        x: 2,
                        y: varTop,
                        text: label,
                        align: 'start'
                      })
                      .setFont(fontStyle);
                  }
                }; // end function draw

                var maxColor = new Color(this.config.style.variance_band_color);
                var minColor = new Color(this.config.style.variance_band_color);
                minColor.a /= bandPositions.length;

                var bandOpacityStep = 1 / bandPositions.length;
                var minOpacity = bandOpacityStep;

                array.forEach(bandPositions, function (pos, i) {
                  drawVarianceBand(pos * stats.scoreStdDev,
                    Color.blendColors(minColor, maxColor, (i + 1) / bandPositions.length)
                    .toCss(true),
                    pos + 'σ');
                });
                drawVarianceBand(0, 'rgba(255,255,0,0.7)', 'mean');
              }
            }));
          } // end variance band

          // draw clip markers
          if (!thisB.config.disable_clip_markers && block.hasOwnProperty('clipRects') && block.clipRects.length > 0) {
            array.forEach(block.clipRects, function (rect) {
              canvas.createRect({
                  x: rect.x,
                  y: rect.y,
                  height: rect.height,
                  width: rect.width
                })
                .setFill(rect.fill);
            });
            block.clipRects = [];
          }

          // draw the origin line if it is not disabled
          var originColor = this.config.style.origin_color;
          if (typeof originColor == 'string' && !{
              'none': 1,
              'off': 1,
              'no': 1,
              'zero': 1
            }[originColor]) {
            var originY = toY(dataScale.origin);
            canvas.createLine({
                x1: 0,
                x2: canvasWidth,
                y1: originY,
                y2: originY
              })
              .setStroke(originColor);
          }
        },

        mouseover: function (bpX, evt) {
          // if( this._scoreDisplayHideTimeout )
          //     window.clearTimeout( this._scoreDisplayHideTimeout );
          if (bpX === undefined) {
            var thisB = this;
            //this._scoreDisplayHideTimeout = window.setTimeout( function() {
            thisB.scoreDisplay.flag.style.display = 'none';
            thisB.scoreDisplay.pole.style.display = 'none';
            //}, 1000 );
          } else {
            var block;
            array.some(this.blocks, function (b) {
              if (b && b.startBase <= bpX && b.endBase >= bpX) {
                block = b;
                return true;
              }
              return false;
            });

            if (!(block && block.canvas && block.pixelScores && evt))
              return;

            var pixelValues = block.pixelScores;
            var canvas = block.canvas.rawNode;
            var cPos = dojo.position(canvas);
            var x = evt.pageX;
            var cx = evt.pageX - cPos.x;

            if (this._showPixelValue(this.scoreDisplay.flag, pixelValues[Math.round(cx)])) {
              this.scoreDisplay.flag.style.display = 'block';
              this.scoreDisplay.pole.style.display = 'block';

              this.scoreDisplay.flag.style.left = evt.clientX + 'px';
              this.scoreDisplay.flag.style.top = cPos.y + 'px';
              this.scoreDisplay.pole.style.left = evt.clientX + 'px';
              this.scoreDisplay.pole.style.height = cPos.h + 'px';
            }
          }
        }

      });

    return SVGXYPlot;
  });
