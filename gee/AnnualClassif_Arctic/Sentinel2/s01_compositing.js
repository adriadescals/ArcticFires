/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #0b4a8b */ee.Geometry.Point([115.14409179152044, -2.305533493389186]),
    geometry2 = /* color: #d63000 */ee.Geometry.Point([147.82719287159054, 69.04756611297326]),
    geometry3 = /* color: #98ff00 */ee.Geometry.Point([171.79157452893008, 68.84890708719954]),
    geometry4 = /* color: #0b4a8b */ee.Geometry.Point([104.28501100992446, 75.4906555591923]),
    geometry5 = /* color: #ffc82d */ee.Geometry.Point([105.72363164991913, 75.09705622430755]),
    geometry6 = /* color: #00ffff */ee.Geometry.Point([150.1850981672696, 68.18919684000528]),
    geometry7 = /* color: #d63000 */ee.Geometry.Point([152.25186979317647, 68.71766970194122]),
    geometry8 = /* color: #d63000 */ee.Geometry.Point([153.02544329202647, 68.80373461501223]),
    geometry9 = /* color: #98ff00 */ee.Geometry.Point([105.06908935269615, 75.00692823708506]),
    geometry10 = /* color: #d63000 */ee.Geometry.Point([177.08468715172356, 68.12457539573649]),
    geometry11 = /* color: #d63000 */ee.Geometry.Point([153.19302328529741, 67.58061556915258]),
    geometry12 = /* color: #d63000 */ee.Geometry.Point([153.57240445646465, 68.0545663561684]),
    geometry13 = /* color: #98ff00 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/

Map.setOptions('satellite')


///////////////////////
// Composites using a moving window
var listSites = [];
for (var ii=1; ii<30; ii++){
  listSites.push(ii)
}
var listSites = [0] // 11 5 2 27 9


var plotResults = true
var exportResults = false

var yy = 2019
var point = geometry12
 
 //_______________________________________________________________________________________________________________________
// SECTION   - Define Cloud mask function for S2 level2A

var S2TOC_cloudMask = function(im){
  var cloudProbMask = im.select('MSK_CLDPRB').lt(60);

  var SCL = im.select('SCL')
  var SCL_mask = (SCL.eq(3).or(SCL.eq(1)).or(SCL.eq(6)).or(SCL.eq(8)).or(SCL.eq(9)).or(SCL.eq(10)).or(SCL.eq(11))).not()
  
  var shadow_mask = im.select(['B12']).lt(600)
    // .or(im.select(['B4']).lt(50))
    // .or(im.select(['B1']).lt(10))
  var snow_mask = im.select(['B1']).unmask(100).gt(430)
  var activeFire_mask = im.select(['B12']).gt(4000)
  
  var kernel1 = ee.Kernel.circle({radius: 200, units:'meters'});
  var cloudProximityMask = im.select('MSK_CLDPRB').lt(60).and(im.select('SCL').neq(3))
    .focal_min({kernel: kernel1, iterations: 1});

  var mask = cloudProbMask
    .and(SCL_mask)
    .and(shadow_mask.not())
    .and(snow_mask.not())
    .and(activeFire_mask.not())


  var kernel2 = ee.Kernel.circle({radius: 20, units:'meters'});
  var mask = mask
            // .focal_min({kernel: kernel2, iterations: 1})
  
  return im
          .updateMask(mask)
          // .updateMask(cloudProximityMask)
          .copyProperties(im);
} 



var addIndices = function(im){
    var ndvi = im.normalizedDifference(['B8', 'B4']).rename('NDVI');
    var rnbr = im.normalizedDifference(['B12', 'B8']).rename('RNBR');
    var nbr = im.normalizedDifference(['B8', 'B12']).rename('NBR');
    var GCCB7 = im.select(['B11']).divide(im.select(['B11']).add(im.select(['B3'])).add(im.select(['B8']))).rename('GCCB7')
    var im2 = im.set('doy',ee.Date(im.get('system:time_start')).getRelative('day', 'year'))
  return im
          .addBands(im2.metadata('doy').int())
          .addBands(GCCB7)
          .addBands(ndvi)
          .addBands(rnbr)
          .addBands(nbr)
          .copyProperties(im);
} 


function maskClouds(img) {
  var clouds = ee.Image(img.get('cloud_mask')).select('probability');
  var isNotCloud = clouds.lt(65);
  return img.updateMask(isNotCloud);
}

function maskEdges(s2_img) {
  return s2_img.updateMask(
      s2_img.select('B8A').mask().updateMask(s2_img.select('B9').mask()));
}

  
  
  

//_______________________________________________________________________________________________________________________
// SECTION   - 


// add-map plot 
var col = ee.ImageCollection("COPERNICUS/S2_SR").filterDate(yy+'-04-01',yy+'-11-01')
  .map(function(im){
    return im.addBands(im.normalizedDifference(['B8', 'B12']))//.updateMask(nd.gt(0));
  })

// Create an image time series chart.
var chart = ui.Chart.image.series({
  imageCollection: col.select('nd'),
  region: point,
  reducer: ee.Reducer.mean(),
  scale: 10,
  xProperty:'system:time_start'
}).setOptions({
series: {
  0: {color: '000000',pointSize:3,lineWidth: 0}
}})
chart.style().set({position: 'bottom-left',width: '600px',height: '280px'});

Map.add(chart);
// print(chart)

chart.onClick(function(xValue, yValue, seriesName) {
  if (!xValue) return;  
  var image = ee.Image(col.filterBounds(point).filter(ee.Filter.equals('system:time_start', xValue)).first());
  var visParams = {"bands":["B8","B4","B3"],"min":510,"max":3800,"gamma":1.703};
  var visParams2 = {"bands":["B11","B8","B4"],"min":475,"max":4221,"gamma":1}
  
  var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
  var dateImage = ((new Date(xValue)).toISOString())
  
  print(ee.Date(xValue),yValue,image)      
  Map.addLayer(image,visParams_post,dateImage,true)
});






//_______________________________________________________________________________________________________________________
// SECTION   - 


var roi = point.buffer(10000).bounds() 

  var s2Sr = ee.ImageCollection('COPERNICUS/S2_SR')
    // .filterBounds(roi)
    .filterDate(yy+'-04-01',yy+'-11-01')
    .filterMetadata('CLOUD_COVERAGE_ASSESSMENT','less_than',90)
    .map(S2TOC_cloudMask)
    .map(addIndices);
  var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
    .filterDate(yy+'-04-01',yy+'-11-01')
    // .filterBounds(roi);
  
  var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply(s2Sr.map(maskEdges),s2Clouds,ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'}));
  
  var S2masked = ee.ImageCollection(s2SrWithCloudMask).map(maskClouds);



// add-map plot 
var col = ee.ImageCollection("COPERNICUS/S2_SR").filterDate(yy+'-04-01',yy+'-11-01')
  .map(function(im){
    return im.addBands(im.normalizedDifference(['B8','B4']))//.updateMask(nd.gt(0));
  })

// Create an image time series chart.
var chart = ui.Chart.image.series({
  imageCollection: S2masked.select('GCCB7'),
  region: point,
  reducer: ee.Reducer.mean(),
  scale: 10,
  xProperty:'system:time_start'
}).setOptions({
series: {
  0: {color: '000000',pointSize:3,lineWidth: 0}
}})
chart.style().set({position: 'bottom-left',width: '600px',height: '280px'});

Map.add(chart);
// print(chart)

chart.onClick(function(xValue, yValue, seriesName) {
  if (!xValue) return;  
  var image = ee.Image(S2masked.filterBounds(point).filter(ee.Filter.equals('system:time_start', xValue)).first());
  var visParams = {"bands":["B8","B4","B3"],"min":510,"max":3800,"gamma":1.703};
  var visParams2 = {"bands":["B11","B8","B4"],"min":475,"max":4221,"gamma":1}
  
  var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
  var dateImage = ((new Date(xValue)).toISOString())
  
  print(ee.Date(xValue),yValue,image)      
  Map.addLayer(image,visParams_post,dateImage,true)
});








//_______________________________________________________________________________________________________________________
// SECTION   - 


    var year = yy
    
    var endDate = ee.Date.fromYMD(yy, 9, 30)
    var startDate = endDate.advance(-6, 'month')
    // print(startDate,endDate)
    
    // find first snow free date
    var firstSnowFree = S2masked.select('doy').filterDate(startDate,endDate)
      .reduce(ee.Reducer.firstNonNull())
      .select('doy_first').rename('doy')
    
    // Create composites
    var QMosaicPRE0 = S2masked.filterDate(startDate,endDate).map(function(im){
     return im.updateMask(im.select('doy').gt(firstSnowFree).and(im.select('doy').lt(firstSnowFree.add(15))))
    }).median() //.qualityMosaic(variableSpring)
    
    var QMosaicPRE1 = S2masked.filterDate(startDate,endDate).map(function(im){
     return im.updateMask(im.select('doy').gt(firstSnowFree).and(im.select('doy').lt(firstSnowFree.add(30))))
    }).median() //.qualityMosaic(variableSpring)
    
    var QMosaicPRE = QMosaicPRE0.unmask(QMosaicPRE1)
    
var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};

  Map.addLayer(QMosaicPRE,visParams_post,'PRE COMP',true)
    
    
    
    


var S2diff = S2masked.map(function(im){
 return im
  .addBands(im.select('NBR').subtract(QMosaicPRE.select('NBR')).rename('NBRdiff'))
  .copyProperties(im,['system:time_start'])
})



// Create an image time series chart.
var chart = ui.Chart.image.series({
  imageCollection: S2diff.select('NBRdiff'),
  region: point,
  reducer: ee.Reducer.mean(),
  scale: 10,
  xProperty:'system:time_start'
}).setOptions({
series: {
  0: {color: '000000',pointSize:3,lineWidth: 0}
}})
chart.style().set({position: 'bottom-left',width: '600px',height: '280px'});

Map.add(chart);
// print(chart)

chart.onClick(function(xValue, yValue, seriesName) {
  if (!xValue) return;  
  var image = ee.Image(S2diff.filterBounds(point).filter(ee.Filter.equals('system:time_start', xValue)).first());
  var visParams = {"bands":["B8","B4","B3"],"min":510,"max":3800,"gamma":1.703};
  var visParams2 = {"bands":["B11","B8","B4"],"min":475,"max":4221,"gamma":1}
  
  var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
  var dateImage = ((new Date(xValue)).toISOString())
  
  print(ee.Date(xValue),yValue,image)      
  Map.addLayer(image,visParams_post,dateImage,true)
});



var S2masked = S2masked.map(function(im){
 return im.addBands(im.select('NBR').multiply(-1).rename('NBRinv'))
    .copyProperties(im,['system:time_start'])
})

var POST = S2masked.qualityMosaic('GCCB7')
var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
 
Map.addLayer(POST,visParams_post,'POST COMP1',true)
Map.addLayer(POST.select('doy'),{min:120, max:250,palette:['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']},'DOY POST COMP',true)




// var POST2 = S2masked.qualityMosaic('NBRinv')
// var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
 
// Map.addLayer(POST2,visParams_post,'POST COMP2',true)
// Map.addLayer(POST2.select('doy'),{min:120, max:250,palette:['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']},'DOY POST COMP',true)












var FIRMS = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/FIRMS_modis_Russian_Federation_above60degrees");

// var yyFIRMS = 2018
// var mmFIRMS = 6
var FIRMSsample = FIRMS.filter(ee.Filter.eq('YY',year))
  // .filter(ee.Filter.eq('MM',mmFIRMS))
Map.addLayer(FIRMSsample,{color:'ff0000'},'FIRMS yy'+year+' mm'+year,true)






//_______________________________________________________________________________________________________________________
// SECTION   - SAVE COMPOSITES
var filtArctic = ee.Geometry.Polygon(
        [[[74.94058812376791, 77.7824697795707],
          [74.94058812376791, 66.81959954580103],
          [192.3624631237679, 66.81959954580103],
          [192.3624631237679, 77.7824697795707]]], null, false);
          
var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_siberia_ScaleGrid_800000_v3").filterBounds(filtArctic);
Map.addLayer(grid,{min:0,max:1},'grid Siberia',false)



var tileIDList = [90] 

print(tileIDList)


var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile)).geometry()
    
// Map.addLayer(roi,{min:0,max:1},'roi',false)

var exportImage = POST.addBands(QMosaicPRE)
  .select(["B12","B8","B4","B12_1","B8_1","B4_1","doy"])
  .multiply(0.0001).multiply(255*2)
  .uint8()
  
Export.image.toAsset({
  image: exportImage,
  description: 'testSiberiaCompS2_20m_v1_'+itile,
  assetId: 'temp/testSiberiaCompS2_20m_v1/region_'+itile,
  scale: 20,
  crs: 'EPSG:3857',
  region: roi,
  maxPixels: 10e10
  });


 return 0
})









// var image = ee.Image("users/globaloilpalm/temp/testSiberiaCompS2_20m_v1/region_90"),
//     imageVisParam = {"opacity":1,"bands":["B12","B8","B4"],"min":26.1,"max":170.9,"gamma":2.0100000000000002},
//     imageVisParam2 = {"opacity":1,"bands":["B12_1","B8_1","B4_1"],"min":26.1,"max":170.9,"gamma":2.0100000000000002};
// Map.addLayer(image,imageVisParam2,'LayerName',true)


// Map.addLayer(image,imageVisParam,'LayerName',true)








