Map.setOptions('satellite')


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

if (0){
  var outClass_dataset = 'S2_siberia_annualClassification_20192020_v9-2'
  var outClass_dataset_output = 'S2_siberia_annualClassification_20192020_v9-2-4'
  
  var listYears = [2019,2020];
  var tileIDList = tilesArctic

}else{
  var listYears = [2021];
  var tileIDList = [33] 
  
  var outClass_dataset = 'S2_siberia_annualClassification2021wout2022_v1-1'
  var outClass_dataset_output = 'S2_siberia_annualClassification2021wout2022_v1-1'
  
}


print(tileIDList)


//_______________________________________________________________________________________________________________________
// SECTION -  FIRST MAP processes the cells in GRID

var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile))
    
//_______________________________________________________________________________________________________________________
// SECTION -  SECOND MAP processes the years
  
  var OUT1 = listYears.map(function(yy){
    
    var year = yy



// var FIRMS_modis = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/FIRMS_modis_Russian_Federation_above60degrees")
// var FIRMS_viirs = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/FIRMS_viirs_Russian_Federation_above60degrees")
  
// var FIRMS = FIRMS_modis.merge(FIRMS_viirs)
//     .filter(ee.Filter.eq('YY',yy));

// // var FIRMS = FIRMS_modis//.filterBounds(geometry)

// // DOY IMAGE only is min
// var empty = ee.Image().byte();
// var FIRMSmask = empty.paint({
//   featureCollection: FIRMS,
//   color: 'YY',
// }).reproject({crs: 'EPSG:3857', scale:10000})
//   .gt(0).unmask(0)
// // var phenoPalette = ['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']

// // var FIRMSmask = FIRMSmask

if (0){
  var FIRMSmask = ee.ImageCollection("users/globaloilpalm/_BA/results/FIRMS_ArcticMask_1km_20012020_v1").select('yy_'+yy).map(function(im){
   return im.unmask(0).neq(0)
  }).max()
  
  }else{
    
  var FIRMSmask = ee.ImageCollection("users/globaloilpalm/_BA/results/FIRMS_ArcticMask_1km_2021NRT_v1").select('yy_'+yy).map(function(im){
   return im.unmask(0).neq(0)
  }).max()
}
//_______________________________________________________________________________________________________________________
// SECTION   - call Composites


// var visParams_post = {"opacity":1,"bands":["B12","B8","B4"],"min":8,"max":111,"gamma":1}
// var visParams_pre = {"opacity":1,"bands":["B12_1","B8_1","B4_1"],"min":8,"max":111,"gamma":1}

// var COMP = ee.ImageCollection("users/globaloilpalm/_BA/results/S2_siberia_annualComposites_20192020_v3")
//   .filter(ee.Filter.eq('yy',yy))
//   .mosaic()
// Map.addLayer(COMP,visParams_pre,'PRE composite '+yy+' v3',false)
// Map.addLayer(COMP,visParams_post,'POST composite '+yy+' v3',false)

//_______________________________________________________________________________________________________________________
// SECTION   - call classification


var outClass = ee.Image("users/globaloilpalm/_BA/results/"+outClass_dataset+"/yy_"+yy+"_cell_"+itile);

var outClassOriginal = outClass
//_______________________________________________________________________________________________________________________
// SECTION   - clean salt and pepper

// var objectId = outClass.connectedComponents({
//   connectedness: ee.Kernel.plus(1),
//   maxSize: 200
// });

// var objectSize = objectId.select('labels')
//   .connectedPixelCount({
//     maxSize: 200, eightConnected: false
//   });

// var ba_area = objectSize.multiply(ee.Image.pixelArea());
// var ba_class_clean = outClass.updateMask(ba_area.gt(50000).unmask(1))
// var outClass = outClass.unmask(0).where(FIRMSmask.not(),ba_class_clean.unmask(0))
// var outClass = outClass.updateMask(outClass.neq(0))


////////
// Map.addLayer(outClass.reproject({crs: tile_crs, scale:30}) ,{min:0,max:1},'outClass 1',true)


var saltPepperThreshold=1000;
var outClass=outClass.updateMask(outClass.connectedPixelCount(saltPepperThreshold,true).gte(saltPepperThreshold)
  .or(FIRMSmask)
  );

// Map.setCenter(156.9391, 67.2081, 10)
// Map.addLayer(outClass.reproject({crs: tile_crs, scale:30}) ,{min:0,max:1},'outClass 2',true)
// Map.addLayer(FIRMSmask.reproject({crs: tile_crs, scale:30}) ,{min:0,max:1},'FIRMSmask',true)
// var imageVisParamComm = {"opacity":1,"bands":["classification"],"palette":["ff0000","05ff00"]};
// Map.addLayer(outClassOriginal.connectedPixelCount(saltPepperThreshold,true).gte(saltPepperThreshold).reproject({crs: tile_crs, scale:30}) ,imageVisParamComm,'conn',true)


//_______________________________________________________________________________________________________________________
// SECTION   - GROWING SEED

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
// SECTION   -  MORPHOLOGY
var postImage_nbr = QMosaicPOST.normalizedDifference(['B8','B11'])
var preImage_nbr = QMosaicPRE.normalizedDifference(['B8','B11'])
// Map.addLayer(postImage_nbr,{min:-0.54,max:0.32},'postImage_nbr',false)
// var BurnAreaResultMaskedv2 = BurnAreaResultMasked.unmask(0).focal_mode(1, 'square','pixels',1)//.reproject({crs: 'EPSG:4326', scale:10})

var kernel1 = ee.Kernel.square({radius: 1});
var kernel2 = ee.Kernel.circle({radius: 1});

var BurnAreaMorph = outClass.unmask(0)
  .focal_max({kernel: kernel1, iterations: 1})
  .focal_min({kernel: kernel1, iterations: 1})
  .focal_max({kernel: kernel2, iterations: 1})
  .focal_min({kernel: kernel2, iterations: 1})
  // .where(preImage_nbr.lt(-0.1),0)
  .where(postImage_nbr.gt(-0.1),0)
  .where(outClass,1)
  // .reproject({crs: 'EPSG:32656', scale:20})
  

var outClass = BurnAreaMorph.updateMask(BurnAreaMorph)



//_______________________________________________________________________________________________________________________
// SECTION   - Clean salt and pepper 2
var saltPepperThreshold=5;

// remove small patches of pixels
var burnAreaClean=outClass.updateMask(outClass.connectedPixelCount(saltPepperThreshold,true).gte(saltPepperThreshold));

// fill gaps within burn scar
var temp = burnAreaClean.unmask(0).eq(0)
var temp = temp.updateMask(temp)

var saltPepperThreshold=6;
var burnAreaClean=burnAreaClean.unmask(0).where(temp.updateMask(temp).connectedPixelCount(saltPepperThreshold,true).gte(saltPepperThreshold).not(),1);
var ba_final=burnAreaClean.updateMask(burnAreaClean.neq(0))


//_______________________________________________________________________________________________________________________
// SECTION   - PLOT RESULTS

var tile_crs = roi.first().get('crs')

if (plotResults){
  
    print(tile_crs)
  var visParamsPost = {"opacity":1,"bands":["B12","B8","B4"],"min":8,"max":111,"gamma":1}
  var visParamsPre = {"opacity":1,"bands":["B12_1","B8_1","B4_1"],"min":8,"max":111,"gamma":1}
  var COMPv8_2020 = ee.ImageCollection("users/globaloilpalm/_BA/results/S2_siberia_annualComposites_20192020_v8")
    .filter(ee.Filter.eq('yy',yy))
    .mosaic()
  Map.addLayer(COMPv8_2020.clip(roi),visParamsPre,'COMPv8 PRE composite '+yy,false)
  Map.addLayer(COMPv8_2020.clip(roi),visParamsPost,'COMPv8 POST composite '+yy,true)
  
  Map.addLayer(roi,{},'roi',false)
  
  if (useNextYearPRE){
    Map.addLayer(FIRMSmask.updateMask(FIRMSmask), {palette:["00ddff"]}, 'FIRMS mask', false);
  }
  Map.addLayer(outClassOriginal,{min:0,max:1,palette:'ffd300'},'Burned area original',true);
  Map.addLayer(ba_final.reproject({crs: ee.String('EPSG:326').cat(ee.String(utmZone)), scale:20}) , {min:0,max:1,palette:'ff0000'}, 'Burn area final',true);
  
  // Map.addLayer(FIRMS.filter(ee.Filter.eq('instrument','MODIS')),{color:'00ddff'},'FIRMSmodis yy'+yy,false)
  // Map.addLayer(FIRMS.filter(ee.Filter.eq('instrument','VIIRS')),{color:'000000'},'FIRMSviirs yy'+yy,false)
  


}


//_______________________________________________________________________________________________________________________
// SECTION   - EXPORT

// print(itile,utmZone)
if (1){
  
  var exportImage = ba_final
        .set('yy',yy)
        .uint8()
        // .set('traininingDataset',traininingDataset)
        // .clip(roi.geometry())

ee.String(tile_crs).evaluate(function(str) {
  Export.image.toAsset({
    image: exportImage,
    description: outClass_dataset_output+'_post_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/'+outClass_dataset_output+'_post/yy_'+yy+'_cell_'+itile,
    scale: 30,
    crs: str,
    region: roi.geometry(),
    pyramidingPolicy: {'classification': 'mode'},
    maxPixels: 10e10
    })
})

}

 return 0
})
 return 0
})



























