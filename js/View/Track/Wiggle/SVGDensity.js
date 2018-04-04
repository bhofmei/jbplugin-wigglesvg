define('WiggleSVGPlotPlugin/View/Track/Wiggle/SVGDensity', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/Color',
    'dojo/colors',
    'dojox/gfx',
    'dojo/dom-construct',
    'JBrowse/View/Track/Wiggle/Density'
  ],
  function (
    declare,
    lang,
    array,
    Color,
    dojoColor,
    gfx,
    domConstruct,
    Density
  ) {
    var SVGDensity = declare(Density,

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
          var normalize = dataScale.normalize;

          var featureColor = typeof this.config.style.color == 'function' ? this.config.style.color :
            (function () { // default color function uses conf variables
              var disableClipMarkers = thisB.config.disable_clip_markers;
              var normOrigin = dataScale.normalize(dataScale.origin);

              return function (p, n) {
                var feature = p['feat'];
                return (disableClipMarkers || n <= 1 && n >= 0)
                  // not clipped
                  ?
                  Color.blendColors(
                    new Color(thisB.getConfForFeature('style.bg_color', feature)),
                    new Color(thisB.getConfForFeature(n >= normOrigin ? 'style.pos_color' : 'style.neg_color', feature)),
                    Math.abs(n - normOrigin)
                  )
                  .toString()
                  // clipped
                  :
                  (n > 1 ? thisB.getConfForFeature('style.pos_color', feature) :
                    thisB.getConfForFeature('style.neg_color', feature));

              };
            })();

          var rects = [];
          block.clipRects = [];

          array.forEach(pixels, function (p, i) {
            if (p) {
              var score = p['score'];
              var f = p['feat'];

              var n = dataScale.normalize(score);
              var fill = '' + featureColor(p, n);
              // check if adding to previous
              if (rects.length > 0 && rects[rects.length - 1].score === score) {
                rects[rects.length - 1].w++;
                // check clip markers
                if (n > 1 || n < 0)
                  block.clipRects[block.clipRects.length - 1].w++
              } else {
                rects.push({
                  x: i,
                  w: 1,
                  score: score,
                  fill: fill
                });
                // check clip marks
                if (n > 1) {
                  block.clipRects.push({
                    x: i,
                    y: 0,
                    w: 1,
                    fill: thisB.getConfForFeature('style.clip_marker_color', f) || 'red'
                  });
                } else if (n < 0) {
                  block.clipRects.push({
                    x: i,
                    y: canvasHeight - 3,
                    w: 1,
                    fill: thisB.getConfForFeature('style.clip_marker_color', f) || 'blue'
                  });
                }
              }
            }
          });
          // draw rectangles
          array.forEach(rects, function (rect) {
//            canvas.createRect({
//                x: rect.x,
//                y: 0,
//                width: rect.w,
//                height: canvasHeight
//              })
//              .setFill(rect.fill);
            rect.y=0;
            thisB._createRect(canvas, rect, canvasHeight);
          });
          // draw clip markers
          if (!thisB.config.disable_clip_markers) {
            array.forEach(block.clipRects, function (rect) {
//              canvas.createRect({
//                  x: rect.x,
//                  y: rect.y,
//                  width: rect.w,
//                  height: 3
//                })
//                .setFill(rect.fill);
              thisB._createRect(canvas, rect, 3);
            });
          }
        },

        /* If it's a boolean track, mask accordingly */
        _maskBySpans: function (scale, leftBase, rightBase, block, canvas, pixels, dataScale, spans) {
          // does not work currently
        },

        /**
         * Draw anything needed after the features are drawn.
         */
        _postDraw: function (scale, leftBase, rightBase, block, canvas, features, featureRects, dataScale) {},

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
        },
      _createRect: function(canvas, rect, height){
        var path = 'M ' + rect.x + ','+rect.y + ' h '+rect.w + ' v '+height + ' h -'+rect.w + ' z';
        canvas.createPath({path: path}).setFill(rect.fill);
      }

      });

    return SVGDensity;
  });
