/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[150.72540238155017, 69.36652254208478],
          [150.72540238155017, 68.81666892356932],
          [152.1714778210033, 68.81666892356932],
          [152.1714778210033, 69.36652254208478]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/



var FIRMS_modis = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/FIRMS_modis_Russian_Federation_above60degrees");
var FIRMS_viirs = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/FIRMS_viirs_Russian_Federation_above60degrees");

var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");
Map.addLayer(grid,{min:0,max:1},'grid Arctic',false)
print(grid)
var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}
 
var tileIDList = tilesArctic

// var tileIDList = [14,15,16,17,29,30,31,32,33]
// var tileIDList = [33]

var listYears = [];
for (var ii=2001; ii<2021; ii++){
  listYears.push(ii)
}

// var listYears = [2019,2020];

print(tileIDList)

//_______________________________________________________________________________________________________________________
// SECTION -  FIRST MAP processes the cells in GRID

var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile))
    var tile_crs = roi.first().get('crs')
    // var roi = ee.FeatureCollection(geometry)
    
//_______________________________________________________________________________________________________________________
// SECTION -  SECOND MAP processes the years
  
  var OUT1 = ee.ImageCollection(listYears.map(function(yy){
    

    
    
var FIRMS = FIRMS_modis.merge(FIRMS_viirs)
  .filterBounds(roi)
  // .filterBounds(geometry)
  .filter(ee.Filter.eq('YY',yy))

// var FIRMSmm = FIRMS.filter(ee.Filter.eq('YY',2019))
// Map.addLayer(FIRMSmm,{color:'ff0000'},'FIRMS 2019',false)


var FIRMSbuffer = FIRMS.map(function(ff){
 return ee.Feature(ff.geometry().buffer(1000,ee.ErrorMargin(100)))
  .copyProperties(ff)
  .set('bla',1)
})//.geometry().dissolve()


// Make an image out of the land area attribute.
var FIRMSbuffer_im = FIRMSbuffer
  .reduceToImage({
    properties: ['bla'],
    reducer: ee.Reducer.median()
}).unmask(0);

if (0){
  Map.addLayer(roi,{},'roi',true)
  Map.addLayer(FIRMS,{color:'0000ff'},'FIRMS '+yy,false)
  Map.addLayer(FIRMSbuffer,{},'FIRMSbuffer',true)
  Map.addLayer(FIRMSbuffer_im,{min:0,max:1},'FIRMSbuffer_im',true)
}

  
  var out = FIRMSbuffer_im
    .multiply(yy-1990)
    .rename('mask')
    .set('yy',yy)
    .set('cell',itile)
    .uint8()
    
  var out = out.updateMask(out.neq(0))
    

 return out
}))

  // Map.addLayer(OUT1.mode(),{min:11,max:30},'FIRMSbuffer_im',true)
  
  var exportImage = OUT1.toBands()
  var exportImage = exportImage.rename(listYears.map(function(yy){return 'yy_'+yy}))
    .uint8()

if (1){

  Export.image.toAsset({
    image: exportImage,
    description: 'FIRMS_ArcticMask_1km_20012020_v1_cell_'+itile,
    assetId: '_BA/results/FIRMS_ArcticMask_1km_20012020_v1/cell_'+itile,
    scale: 100,
    crs: tile_crs,
    region: roi.geometry(),
    pyramidingPolicy: {'mask': 'mode'},
    maxPixels: 10e10
    });
}
    
  
 return 0
})


    
    
    
    
    









