/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry2 = /* color: #98ff00 */ee.Geometry.MultiPoint(),
    geometry = /* color: #d63000 */ee.Geometry.Point([167.61214551988186, 68.26197763226929]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/


var useNextYearPRE = false
 var plotResults = false

 //_______________________________________________________________________________________________________________________
// SECTION   - Define Cloud mask function for S2 level2A

var S2TOC_cloudMask = function(im){
  var cloudProbMask = im.select('MSK_CLDPRB').lt(60);

  var SCL = im.select('SCL')
  var SCL_mask = (SCL.eq(3).or(SCL.eq(1)).or(SCL.eq(6)).or(SCL.eq(8)).or(SCL.eq(9)).or(SCL.eq(10)).or(SCL.eq(11))).not()
  
  var shadow_mask = im.select(['B12']).lt(600)
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
  
  return im
          .updateMask(mask)
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

var addIndices = function(im){
    var ndvi = im.normalizedDifference(['B8', 'B4']).rename('ndvi');
    var rnbr = im.normalizedDifference(['B12', 'B8']).rename('RNBR');
    var nbr = im.normalizedDifference(['B8', 'B12']).rename('nbr');
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





  


//_______________________________________________________________________________________________________________________
// SECTION -  Call GRID and define the cells to be processed

var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
var visParams_pre = {"opacity":1,"bands":["B12_1","B8_1","B4_1"],"min":500,"max":3000,"gamma":1.7};

// var filtArctic = ee.Geometry.Polygon(
//         [[[74.94058812376791, 77.7824697795707],
//           [74.94058812376791, 66.81959954580103],
//           [192.3624631237679, 66.81959954580103],
//           [192.3624631237679, 77.7824697795707]]], null, false);
          
// var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_siberia_ScaleGrid_800000_v3").filterBounds(filtArctic);
// Map.addLayer(grid,{min:0,max:1},'grid Siberia',false)
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

var listYears = [2019,2020];
var listYears = [2021];

print(tileIDList)

//_______________________________________________________________________________________________________________________
// SECTION -  FIRST MAP processes the cells in GRID

var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile))
    
//_______________________________________________________________________________________________________________________
// SECTION -  SECOND MAP processes the years
  
  var OUT1 = listYears.map(function(yy){
    
    var year = yy
    
    // var roi = geometry //ee.Feature(regionsTraining.toList(100).get(iregion)).geometry()
//_______________________________________________________________________________________________________________________
// SECTION -  CALL Sentinel-2
    var S2 = ee.ImageCollection("COPERNICUS/S2_SR")
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T50WPV_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T50WNA_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T51WVQ_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T51WWP_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T51WWQ_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200810T030551_N0214_R075_T53WNU_20200810T053646')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200810T030551_N0214_R075_T53WNV_20200810T053646')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200810T030551_N0214_R075_T53WPU_20200810T053646')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200810T030551_N0214_R075_T54WVD_20200810T053646')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T50WNV_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T51WVP_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20200817T034539_N0214_R104_T50WPA_20200817T065421')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200828T072621_N0214_R049_T42WXB_20200828T080541')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2A_MSIL2A_20200807T025551_N0214_R032_T54XWF_20200807T052555')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20190508T035549_N0213_R004_T50WPE_20191017T131447')
      .filterMetadata('PRODUCT_ID', 'not_equals', 'S2B_MSIL2A_20190508T035549_N0213_R004_T51WVU_20191017T131447')
      .filterMetadata('GENERAL_QUALITY','not_equals','FAILED')
      
  var s2Sr = S2
    .filter(ee.Filter.calendarRange(yy, yy+1, 'year'))
    .filter(ee.Filter.calendarRange(91, 258, 'day_of_year'))
    .filterMetadata('CLOUD_COVERAGE_ASSESSMENT','less_than',90)
    .map(S2TOC_cloudMask)
    .map(addIndices);
  var s2Clouds = ee.ImageCollection('COPERNICUS/S2_CLOUD_PROBABILITY')
    .filter(ee.Filter.calendarRange(yy, yy+1, 'year'))
    .filter(ee.Filter.calendarRange(91, 258, 'day_of_year'))
  
  var s2SrWithCloudMask = ee.Join.saveFirst('cloud_mask').apply(s2Sr.map(maskEdges),s2Clouds,ee.Filter.equals({leftField: 'system:index', rightField: 'system:index'}));
  var S2masked = ee.ImageCollection(s2SrWithCloudMask).map(maskClouds);


//_______________________________________________________________________________________________________________________
// SECTION -  CREATE COMPOSITES PRE AND POST


// COMPOSITE yy
    var endDate = ee.Date.fromYMD(yy, 8, 31)
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
    
    var PRE1 = QMosaicPRE0.unmask(QMosaicPRE1)
    var POST1 = S2masked.filter(ee.Filter.calendarRange(yy, yy, 'year')).qualityMosaic('GCCB7')
    
if (useNextYearPRE==1){
// COMPOSITE yy+1
    var endDate = ee.Date.fromYMD(yy+1, 8, 31)
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
    
    var PRE2 = QMosaicPRE0.unmask(QMosaicPRE1)
}


//_______________________________________________________________________________________________________________________
// SECTION   - MERGE COMPOSITES

if (useNextYearPRE==1){
  var QMosaicPOST = ee.ImageCollection.fromImages([PRE2,POST1]).qualityMosaic('GCCB7')
}else{
  var QMosaicPOST = POST1
}

var QMosaicPRE = PRE1

var COMP = QMosaicPOST.addBands(QMosaicPRE)//.unmask(0)

//_______________________________________________________________________________________________________________________
// SECTION - CLASSIFICATION 

      // var bands = ['B6','B8A_1','B12','B9','B8']  // V1
      // var bands = ['B9','B5_1','B12','B11','B8A_1','B12_1','B2','B8'] // V2
      
      // var bands = ["B8A","B9_1","B3","B12_1","B12","B11","B1","B5","B4","B8A_1","B2"] // V3
      
      
// var bands = ee.List(['B4','B8','B12','B4_1','B8_1','B12_1'])

var bands = ee.List(['B4','B8','B12','B4_1','B8_1','B12_1'])
  .cat(ee.List(['B2','B3','B5','B6','B7','B8A','B9','B11',
    'B2_1','B3_1','B5_1','B6_1','B7_1','B8A_1','B9_1','B11_1']))

     

      var X = COMP.select(bands)//.divide((0.0001*255*2))
      
      var traininingDataset = "users/globaloilpalm/temp/S2_arctic_newTraining_manualCollection_v2"
      var training = ee.FeatureCollection(traininingDataset)
          .filter(ee.Filter.neq('B8',0))
          .filter(ee.Filter.notNull(['B8']));;
      
      // train Random Forests
      var numberOfTrees = 80
      var RFclassifier = ee.Classifier.smileRandomForest({
        numberOfTrees: numberOfTrees,
        // variablesPerSplit: 0,
        // minLeafPopulation:1,
        // bagFraction: 0.5,
        // outOfBagMode: false,
        seed: 0
      }).train({
        features: training,
        classProperty: 'Class',
        inputProperties: bands
        });
            
      // predict on image
      var out1 = X.select(bands).classify(RFclassifier)//.clip(grid.filter(ee.Filter.eq('ID',tileID)))
        
      // mode FILTER
      var out1 = out1.updateMask(out1)//.focal_mode(2, 'square','pixels',1).reproject({crs: 'EPSG:4326', scale:10})
        .uint8()
        .set('yy',yy)
        .set('traininingDataset',traininingDataset)


  
var tile_crs = roi.first().get('crs')
//_______________________________________________________________________________________________________________________
// SECTION   - PLOT RESULTS

if (plotResults){
  
    Map.addLayer(roi,{},'roi',true)
    var visParams = {"opacity":1,"bands":["B12","B8","B4"],"min":500,"max":3000,"gamma":1.7};
    Map.addLayer(QMosaicPRE,visParams,'PRE COMP',true)
    Map.addLayer(QMosaicPOST,visParams,'POST COMP',true)
    var classVisParam = {"min":1,"max":2,"palette":["ff0000"]};
    Map.addLayer(out1,classVisParam,'fast classif',true);
    Map.addLayer(roi.geometry(),{min:0,max:1},'bounds '+itile,true)
    
    print(itile,tile_crs)
}

//_______________________________________________________________________________________________________________________
// SECTION   - EXPORT RESULTS




if (1){
var exportImage = out1
    // .clip(roi.geometry())
ee.String(tile_crs).evaluate(function(str) {
  Export.image.toAsset({
    image: exportImage,
    description: 'annualClassification_2021wout2022_v1-1_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/S2_siberia_annualClassification2021wout2022_v1-1/yy_'+yy+'_cell_'+itile,
    // description: 'annualClassification_20192020_v9-2_yy_'+yy+'_cell_'+itile,
    // assetId: '_BA/results/S2_siberia_annualClassification_20192020_v9-2/yy_'+yy+'_cell_'+itile,
    scale: 20,
    crs: str,
    region: roi.geometry(),
    pyramidingPolicy: {'classification': 'mode'},
    maxPixels: 10e10
      });
  })
}



if (0){
  var exportImage = COMP.select(['B4','B8','B12','B4_1','B8_1','B12_1'])
    .multiply(0.0001).multiply(255*2)
    .clip(roi.geometry())
    .set('yy',yy)
    .uint8()
    
  Export.image.toAsset({
    image: exportImage,
    description: 'S2_siberia_annualComposites_20192020_v9-2_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/S2_siberia_annualComposites_20192020_v9-2/yy_'+yy+'_cell_'+itile,
    scale: 80,
    crs: tile_crs,
    region: roi.geometry(),
    maxPixels: 50e10
    });
}


if (0){
  // print(COMP)
  
  // var bandsList = ee.List(['B1','B2','B3','B4','B5','B6','B7','B8','B8A','B9','B11','B12',
  // 'B1_1','B2_1','B3_1','B4_1','B5_1','B6_1','B7_1','B8_1','B8A_1','B9_1','B11_1','B12_1'])
  var bandsList = ee.List(['B2','B3','B5','B6','B7','B8A','B9','B11',
  'B2_1','B3_1','B5_1','B6_1','B7_1','B8A_1','B9_1','B11_1'])
  
  var exportImage = COMP.select(bandsList)
    .multiply(0.0001).multiply(255*2)
    .clip(roi.geometry())
    .set('yy',yy)
    .uint8()
    
  Export.image.toAsset({
    image: exportImage,
    description: 'S2_siberia_annualComposites_OtherBands_20192020_v8_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/S2_siberia_annualComposites_OtherBands_20192020_v8/yy_'+yy+'_cell_'+itile,
    scale: 80,
    crs: tile_crs,
    region: roi.geometry(),
    maxPixels: 50e10
    });
}


 return out1
  .addBands(COMP)
})

//_______________________________________________________________________________________________________________________
// SECTION -  Sort out output images

var OUT1 = ee.ImageCollection(OUT1)
// print(OUT1)

var PRE = OUT1.qualityMosaic('ndvi_1')
var POST = OUT1.qualityMosaic('GCCB7')
// Map.addLayer(PRE,visParams_pre,'QMosaic pre',true)
// Map.addLayer(POST,visParams_post,'QMosaic post',true)

var CLASS = OUT1.select('classification').min()
var classVisParam = {"min":29,"max":30,"palette":["ff0000","ff00ff"]};
// Map.addLayer(CLASS,classVisParam,'fast classif OUT1',true);

// Map.addLayer(roi,{min:0,max:1},'roi',true)


//_______________________________________________________________________________________________________________________
// SECTION -  SAVE RESULTS
var exportImage = POST.addBands(PRE)
  .select(['B4','B8','B12','B4_1','B8_1','B12_1'])
  .multiply(0.0001).multiply(255*2)
  .addBands(CLASS)
  .uint8()
  
if (0){
  Export.image.toAsset({
    image: exportImage,
    description: 'annualClassification_20192020_v1_cell_'+itile,
    assetId: '_BA/results/S2_siberia_annualClassification_20192020_v2/cell_'+itile,
    scale: 20,
    crs: 'EPSG:3857',
    region: roi,
    maxPixels: 10e10
    });
}

 return 0
})





