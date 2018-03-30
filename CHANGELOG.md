# Change log

## [v1.0.2] - 2018-03-30
- Fixed issue where density blocks are deleted if a track with a y-scale is rendered after the density track
  - Y-scale render uses function to find all "svg rect" elements then removes them
  - Instead of using svg rects, now use svg path

## [v1.0.1] - 2018-02-08
- Fixed issue not showing minus strand coverage

## [v1.0.0]
- First functional release
