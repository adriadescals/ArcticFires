/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([125.40793534432929, 67.46809220358259]),
    geometry2 = /* color: #98ff00 */ee.Geometry.Point([125.97722126185064, 67.91495605377183]),
    geometry3 = /* color: #d63000 */ee.Geometry.Point([124.65271717150213, 68.16074446614677]),
    geometry4 = /* color: #98ff00 */ee.Geometry.Point([131.55906299473799, 62.604394854818565]),
    geometry5 = /* color: #d63000 */ee.Geometry.Point([134.29754213836563, 63.363853244660575]),
    geometry6 = /* color: #d63000 */ee.Geometry.Point([132.85349051961748, 62.95306658359356]),
    geometry7 = /* color: #d63000 */ee.Geometry.Point([160.35547615050817, 68.63034399345548]),
    geometry8 = /* color: #98ff00 */ee.Geometry.Point([134.01631490301457, 69.47362002950915]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// CLASSIFICATION OF BURNED AREAS WITH LANDSAT578 IN SIBERIA
 
Map.setOptions('satellite') 
 
//_______________________________________________________________________________________________________________________
// SECTION 0 - Set up parameters
 
 
var plotResults = false // plot time series. If set to true, exporting the results is unabled. It is recommended to reduce the 'lag' to 5 or less


// Call grid in Siberia
var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");
Map.addLayer(grid,{min:0,max:1},'grid Arctic',false)

var tilesArctic = [];
for (var ii=31; ii<40; ii++){
  tilesArctic.push(ii)
}
 

var tileIDList = tilesArctic
// var tileIDList = [30]



var listYears = [];
for (var ii=1997; ii<2022; ii++){
  listYears.push(ii)
}
 
// var listYears = [2018,2019];

///////////// map tile IDs /////////////////
var OUT = tileIDList.map(function(itile){

var roi = grid.filter(ee.Filter.eq('ID',itile))

// Map.addLayer(roi)

var tile_crs = roi.first().get('crs')

// Vis params for Landsat images
var visParams_post = {"opacity":1,"bands":["SWIR2","NIR","Red"],"min":10/(0.0001*255*2),"max":160/(0.0001*255*2),"gamma":1}



//_______________________________________________________________________________________________________________________
// SECTION 1 -CALL TRAINING DATASET
var traininingDataset = "users/globaloilpalm/temp/Landsat_arctic_newTraining_manualCollection_v1"
var training = ee.FeatureCollection(traininingDataset)

//_______________________________________________________________________________________________________________________
// SECTION 2 - Landsat collection



// coefficients of harmonization
var coefficients = {
  itcps: ee.Image.constant([0.0003, 0.0088, 0.0061, 0.0412, 0.0254, 0.0172])
             .multiply(10000),
  slopes: ee.Image.constant([0.8474, 0.8483, 0.9047, 0.8462, 0.8937, 0.9071])
};

// Function to get and rename bands of interest from OLI. // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
function additionalMask(im) {
  var mask1 = im.select('NIR').lt(3000)
  var mask2 = im.select('SWIR2').lt(2100)
  var mask3 = im.select('SWIR2').gt(500)
  return im
    .updateMask(mask1)
    .updateMask(mask2)
    .updateMask(mask3)
}



// Function to get and rename bands of interest from OLI.
function renameOli(img) {
  return img.select(
      ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'pixel_qa'],
      ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'pixel_qa']);
}

// Function to get and rename bands of interest from ETM+.
function renameEtm(img) {
  return img.select(
      ['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'],
      ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'pixel_qa']);
}

var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var cloud = qa.bitwiseAnd(1 << 5)
          .and(qa.bitwiseAnd(1 << 4))
          .and(qa.bitwiseAnd(1 << 7))
          .or(qa.bitwiseAnd(1 << 3))
  // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};

function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var snowBitMask = 1 << 4;

  // Get the pixel QA band.
  var qa = image.select('pixel_qa');

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0))
      .and(qa.bitwiseAnd(snowBitMask).eq(0));

  // Return the masked image, scaled to reflectance, without the QA bands.
  return image.updateMask(mask)//.divide(10000)
      .select("B[0-9]*")
      .copyProperties(image, ["system:time_start"]);
}


function etmToOli(img) {
  return img.select(['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2'])
      .multiply(coefficients.slopes)
      .add(coefficients.itcps)
      .round()
      .toShort()
      .addBands(img.select('pixel_qa'));
}

function fmask(img) {
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var snowBitMask = 1 << 4;
  var qa = img.select('pixel_qa');
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0))
                 .and(qa.bitwiseAnd(snowBitMask).eq(0));
  return img.updateMask(mask);
}

function calcNbr(img) {
  var nbr = img.normalizedDifference(['SWIR2', 'NIR'])
  var nbr2 = img.normalizedDifference(['NIR','SWIR2'])
  var ndvi = img.normalizedDifference(['NIR', 'Red'])//.divide(img.select('SWIR1').divide(1000))
  var GCCB7 = img.select(['SWIR1']).divide(img.select(['SWIR1']).add(img.select(['Red'])).add(img.select(['NIR']))).rename('GCCB7')
  return img.addBands(GCCB7.rename('GCCB7')).addBands(nbr.rename('nbr')).addBands(nbr2.rename('nbr2')).addBands(ndvi.rename('ndvi'));
}

// function calcNbr(img) {
//   var nbr = img.normalizedDifference(['SWIR2', 'NIR'])//.divide(img.select('SWIR1').divide(1000))
//   var scaledImg = img.select('SWIR2').unitScale(823, 1647)
//     .addBands(img.select('NIR').unitScale(627, 2196))
//     .addBands(img.select('Red').unitScale(274, 843))
//     .multiply(10000).int()
//   var eucDist = ee.Image(30000).subtract((((scaledImg.select('SWIR2').subtract(3424)).pow(2))
//     .add(((scaledImg.select('NIR').subtract(-217)).pow(2)))
//     .add(((scaledImg.select('Red').subtract(-32)).pow(2)))
//     ).sqrt()).int()
//   return img.addBands(eucDist.rename('nbr')).addBands(nbr.rename('nbr2'));
// }

var removeL5strip = function(im){
  var nbr = im.normalizedDifference(['B7','B4'])
 var mask = im.select("B[1-7]*").lt(0).reduce(ee.Reducer.sum()).or(im.select('B1').gt(4000)).or(nbr.gt(0.6))
  return im.updateMask(mask.not())}
  


// Define function to prepare OLI images.
function prepOli(img) {
  var orig = img;
  img = renameOli(img);
  //img = maskL8sr(img);
  img = fmask(img);
  img = calcNbr(img);
  img = additionalMask(img);
  return ee.Image(img.copyProperties(orig, orig.propertyNames()));
}

// Define function to prepare ETM+ images.
function prepEtm(img) {
  var orig = img;
  img = renameEtm(img);
  // img = cloudMaskL457(img)
  img = fmask(img);
  img = etmToOli(img);
  img = calcNbr(img);
  img = additionalMask(img);
  return ee.Image(img.copyProperties(orig, orig.propertyNames()));
}


var colFilter = ee.Filter.and(
    ee.Filter.bounds(roi), 
    // ee.Filter.date(startDate,endDate),
    // ee.Filter.metadata('SOLAR_ZENITH_ANGLE','less_than',55),
    ee.Filter.calendarRange(91, 258, 'day_of_year'),
    // ee.Filter.eq('WRS_PATH', 119),
    // ee.Filter.eq('WRS_ROW', 16),
    ee.Filter.lt('CLOUD_COVER', 80)//,
    // ee.Filter.lt('GEOMETRIC_RMSE_MODEL', 10),
    // ee.Filter.or(
    //     ee.Filter.eq('IMAGE_QUALITY', 9),
    //     ee.Filter.eq('IMAGE_QUALITY_OLI', 9))
);


var oliCol = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR').filter(colFilter).map(prepOli);
var etmCol = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR').filter(colFilter).map(prepEtm);
var tmCol = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR').filter(colFilter).map(removeL5strip).map(prepEtm);


// Merge the collections.
var blankIm = ee.Image(1).clip(roi).int()
var colMerged = oliCol.map(function(im){return im.addBands(blankIm.multiply(3).rename('SAT'))})
  .merge(etmCol.map(function(im){return im.addBands(blankIm.multiply(2).rename('SAT'))}))
  .merge(tmCol.map(function(im){return im.addBands(blankIm.rename('SAT'))}));
// var colMerged = oliCol.merge(etmCol).merge(tmCol);

// Filter faulty images
var colMerged = colMerged.filterMetadata('LANDSAT_ID', 'not_equals', 'LE07_L1TP_108015_20200701_20200728_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_110014_20200723_20200807_01_T1') 
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_111019_20200714_20200722_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_127016_20200815_20200822_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_102014_20200901_20200906_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_135008_20200924_20201005_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_160009_20200822_20200905_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_158011_20200723_20200807_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_097011_20200914_20200920_01_T1')
  .filterMetadata('LANDSAT_ID', 'not_equals', 'LC08_L1TP_147009_20210627_20210707_01_T1')
  


var col = colMerged.map(function(im){
    var im2 = im
    .set('month',ee.Date(im.get('system:time_start')).get('month'))
    .set('year',ee.Date(im.get('system:time_start')).get('year'))
    .set('day',ee.Date(im.get('system:time_start')).get('day'))
    .set('doy',ee.Date(im.get('system:time_start')).getRelative('day', 'year'))
    .set('system:time_start',im.get('system:time_start'))
    return im2
    // .addBands(CLIMATO)
    // .addBands(elevation)
    // .addBands(im2.metadata('month'))
    .addBands(im2.metadata('year'))
    // .addBands(im2.metadata('day'))
    .addBands(im2.metadata('doy'))
    // .addBands(im2.metadata('SOLAR_ZENITH_ANGLE'))
    // .addBands(im2.metadata('system:time_start','date1').divide(86400000))
});
// print('size Landsat 5,7, and 8 collections:',col.size())



////////////////////////////////////
// Generate CLIMATO (PRE composite)
var col2 = col
  .filter(ee.Filter.calendarRange(1997, 2020, 'year'))
  // .filterDate(startDate,endDate)
  // .filter(ee.Filter.calendarRange(136, 245, 'day_of_year'))
  .filter(ee.Filter.calendarRange(7, 7, 'month'))
  .map(function(im){
    return im
    .set('month',ee.Date(im.get('system:time_start')).get('month'))
    .set('system:time_start',im.get('system:time_start'))
    .addBands(im.metadata('system:time_start','date1').divide(86400000))
  });
  
var maxNBRdate = col2.qualityMosaic('nbr').select('date1')
var maxNBR = col2.select('nbr').max()

var climatoNoDisturbance = col2.filterDate('2015-01-01','2020-01-01').median()//.updateMask(maxNBR.lt(-0.1))
// Map.addLayer(climatoNoDisturbance,visParams_post,'climatoNoDisturbance',false)

var compPREnbr = col2.map(function(im){
  var dateMask = im.select('date1').lt(maxNBRdate.subtract(365*1))
    .and(im.select('date1').gte(maxNBRdate.subtract(365*4)))
 return im.updateMask(dateMask)
}).median()

var PRE = climatoNoDisturbance.where(maxNBR.gte(-0.1).and(compPREnbr.select('NIR').unmask(-999).neq(-999)),compPREnbr)
// Map.addLayer(CLIMATO,visParams_post,'Pre-composite (Landsat Climatology)',false)

var PRE = PRE.select(['Blue','Green','Red','NIR','SWIR1','SWIR2','SAT','year'])




var OUT1 = ee.ImageCollection(listYears.map(function(yy){
   
// Devine start and end dates
var endDate = ee.Date.fromYMD(yy, 12, 31)
var startDate = ee.Date.fromYMD(yy, 1, 1)

var POST = col.filterDate(startDate,endDate).qualityMosaic('nbr').select(['Blue','Green','Red','NIR','SWIR1','SWIR2','SAT','year'])


//_______________________________________________________________________________________________________________________
// SECTION   - 
var COMP = POST.addBands(PRE)


//_______________________________________________________________________________________________________________________
// SECTION 5 - Apply RF to a image collection of daily images

var bands = ee.List(['Red','NIR','SWIR2','Red_1','NIR_1','SWIR2_1'])
  .cat(ee.List(['Blue','Green','SWIR1','Blue_1','Green_1','SWIR1_1']))

var NBRmask = COMP.normalizedDifference(['NIR','SWIR2']).lt(0.1)
var X = COMP.select(bands).updateMask(NBRmask)

// train Random Forests
var numberOfTrees = 80 // this parameter should be checked
var RFclassifier = ee.Classifier.smileRandomForest({
  numberOfTrees: numberOfTrees,
  // variablesPerSplit: 0,
  // minLeafPopulation: 2,
  // bagFraction: 0.5,
  // outOfBagMode: false,
  seed: 3535
}).train({
  features: training,
  classProperty: 'Class',
  inputProperties: bands
  });
  

var out1 = X.select(bands).classify(RFclassifier) // predict on daily image

var out1 =  out1.updateMask(out1)
  .uint8()
  .set('yy',yy)
  .set('traininingDataset',traininingDataset) 

  
//_______________________________________________________________________________________________________________________
// SECTION   - PLOT RESULTS

if (plotResults){
  
    Map.addLayer(roi,{},'roi',true)
    var visParams_pre = {"opacity":1,"bands":["SWIR2_1","NIR_1","Red_1"],"min":20/(0.0001*255*2),"max":120/(0.0001*255*2),"gamma":1}
    var visParams_post = {"opacity":1,"bands":["SWIR2","NIR","Red"],"min":20/(0.0001*255*2),"max":120/(0.0001*255*2),"gamma":1}
    Map.addLayer(COMP,visParams_pre,'PRE COMP',false)
    Map.addLayer(COMP,visParams_post,'POST COMP',true)
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
  Export.image.toAsset({
    image: exportImage,
    description: 'L578_siberia_annualClassification_19972020_v2-1_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/L578_siberia_annualClassification_19972020_v2-1/yy_'+yy+'_cell_'+itile,
    scale: 30,
    crs: tile_crs,
    region: roi.geometry(),
    pyramidingPolicy: {'classification': 'mode'},
    maxPixels: 10e10
    });
}

if (0){
  var exportImage = COMP.select(["SWIR2","NIR","Red"])
    .multiply(0.0001).multiply(255*2)
    .clip(roi.geometry())
    .set('yy',yy)
    .uint8()
    
  Export.image.toAsset({
    image: exportImage,
    description: 'L578_siberia_annualComposites_19972020_v2-2_yy_'+yy+'_cell_'+itile,
    assetId: '_BA/results/L578_siberia_annualComposites_19972020_v2-2/yy_'+yy+'_cell_'+itile,
    scale: 90,
    crs: tile_crs,
    region: roi.geometry(),
    maxPixels: 50e10
    });
}


return out1
}))



// function to convert ImageCollection to multi-band image
var col2im = function(images) {
  images = images.map(function(i) { return i.unmask(-1) }) 

  var array = images.toArray()
  var bandNames = images.aggregate_array('year') // rootName is 'year'
  var image = array.arrayProject([0]).arrayFlatten([bandNames])
return image
};


// Generate binary maps of burned area from 1997 to 2020
var years = ee.List.sequence(1997, 2020);

var col_yearly = ee.ImageCollection(years.map(function(yy){
  var colYear = OUT1.select('classification').filter(ee.Filter.eq('yy',yy))
  return colYear.max()
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('empty', colYear.size().eq(0))
    .set('year',ee.String('yy_').cat(ee.String(ee.Number(yy).int())))
}).flatten()).filterMetadata('empty', 'equals', 0)


var ba_yearIm = col2im(col_yearly).uint8()

// print(ba_yearIm)

if (0){
  
    // .clip(roi.geometry())
  Export.image.toAsset({
    image: ba_yearIm,
    description: 'L578_siberia_annualClassification_19972020_v2-2_yy_19972020_cell_'+itile,
    assetId: 'temp/L578_siberia_annualClassification_19972020_v2-2_yy_19972020_cell_'+itile,
    scale: 300,
    crs: tile_crs,
    region: roi.geometry(),
    pyramidingPolicy: {'classification': 'mode'},
    maxPixels: 10e10
    });
}










return 0
})





