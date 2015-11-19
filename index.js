var tilelive = require('tilelive');
var MBTiles = require('mbtiles');
var SphericalMercator = require('sphericalmercator');

require('tilelive-mapnik').registerProtocols(tilelive);

var filePath = './data/parcels.xml';
var uri = 'mapnik://' + filePath;
var merc = new SphericalMercator({
  size: 256
});

new MBTiles('./data/parcels.mbtiles', function(err, mbtiles) {
  // TODO handle case where file already exists (overwrite?)
  var x, y, z, xlen, ylen, zlen;
  if (err) throw err;

  mbtiles.startWriting(function(err) {
    // TODO How to determine when to call mbtiles.stopWriting (async)?
    if (err) throw err;
    loadGrids(uri);
  });

  var bbox;

  function loadGrids(uri){
    tilelive.load(uri, function loader(err, source) {
      if(err) throw err;
      source.getInfo(function infoGetter(err, info) {
        if (err) throw err;
        bbox = info.bounds;
        for(z=info.minzoom, zlen = info.maxzoom; z<zlen+1; z++) {
          var tileBounds = getXYZ(z);
          for(x=tileBounds.minX, xlen = tileBounds.maxX; x<xlen+1; x++ ) {
            for(y=tileBounds.minY, ylen = tileBounds.maxY; y<ylen+1; y++) {
              source.getGrid(z, x, y, insertGrid);
            }
          }
        }
      });
    });
  }

  function insertGrid(err, grid, options) {
    if (err) throw err;
    if (grid) {
      mbtiles.putGrid(z, x, y, grid, function(err) {
        if (err) throw err;
      });
    }
  }

  function getXYZ(zoom) {
    var xyzBounds = merc.xyz(bbox, zoom);
    return(xyzBounds);
  }
});
