/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([100.84250565682929, 72.40360333134464]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

//_______________________________________________________________________________________________________________________
// SECTION 0 - Set up parameters

 
var plotResults = true // plot time series. If set to true, exporting the results is unabled. It is recommended to reduce the 'lag' to 5 or less

var year = 2021 // last year of analysis (inclusive)
var lag = 25 // year-lag = first year of analysis  // Set this parameter to 24 in order to analyse the 1997-2020 period 

// var itile = 65 // cell grid to be processed (in the future this will be a list with all cell IDs that will be mapped with a function)
var iversion = 1 // version of the algorithm





// Call grid in Siberia
var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");
Map.addLayer(grid,{min:0,max:1},'grid Arctic',false)

var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}

var tileIDList = tilesArctic
// var tileIDList = [14,15,16,17,29,30,31,32,33]
var tileIDList = [9,10]

//_______________________________________________________________________________________________________________________
// SECTION   - Export tiles



///////////// map tile IDs /////////////////
var OUT = tileIDList.map(function(itile){
  
  
// // Define roi 
// if (plotResults){
//   var roi = point
//   // Map.centerObject(roi,11)
// }else{ // roi area = cell grid
//   var roi = grid.filter(ee.Filter.eq('ID',itile)).geometry()
// }
// // Map.addLayer(roi)
var roi = grid.filter(ee.Filter.eq('ID',itile))

var tile_crs = roi.first().get('crs')

// Vis params for Landsat images
var visParams_post = {"opacity":1,"bands":["SWIR2","NIR","Red"],"min":10/(0.0001*255*2),"max":160/(0.0001*255*2),"gamma":1}



//_______________________________________________________________________________________________________________________
// SECTION 1 -CALL TRAINING DATASET
{

var training = ee.FeatureCollection("users/globaloilpalm/_BA/training_points/L578_samples_BA_Siberia_v2_withCLIMATO579_DEM_2000_2020_withNewSamplesv1")
  .filter(ee.Filter.notNull(['NDVI_climato7'])) // remove points without pre composite
  .filter(ee.Filter.notNull(['elevation'])); // remove points without elevation
  
  
// var training = training.randomColumn('random', 3535).filter(ee.Filter.gt('random',0.8))
// var training = training.filter(ee.Filter.gt('latitude',66.5))


// Map.addLayer(training,{min:0,max:1},'training samples',false)
// print(training.toList(10))
// print('size training:', training.size())
// print('size training:', training.filter(ee.Filter.eq('Class',0)).size())
// print('size training:', training.filter(ee.Filter.eq('Class',1)).filter(ee.Filter.eq('Class',1)).size())
// print(training.filter(ee.Filter.notNull(['NDVI_climato7'])).size())


}


//_______________________________________________________________________________________________________________________
// SECTION 2 - Landsat harmonization (taken partially from 'GEE Community tutorials')
{

// Devine start and end dates
var endDate = ee.Date.fromYMD(year, 12, 31)
var startDate = ee.Date.fromYMD(year, 12, 31).advance(-lag, 'year')

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
    ee.Filter.date(startDate,endDate),
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

}


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


// var Qmosaic = col.qualityMosaic('nbr')
var POST = col.qualityMosaic('nbr').select(['Blue','Green','Red','NIR','SWIR1','SWIR2','SAT','year'])






////////////////////////////////////
// Generate CLIMATO (PRE composite)
var col2 = col
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








//_______________________________________________________________________________________________________________________
// SECTION   - 

var visParams_post = {"opacity":1,"bands":["SWIR2","NIR","Red"],"min":10/(0.0001*255*2),"max":160/(0.0001*255*2),"gamma":1}
Map.addLayer(POST,visParams_post,'Qmosaic corrected '+itile,true)
// Map.addLayer(roi,{},'roi',true)



//_______________________________________________________________________________________________________________________
// SECTION   - EXPORT


if (1){
  
var exportImage = POST.addBands(PRE)
  .select(['Red','NIR','SWIR2'])
  .multiply(0.0001*255*2)
  .uint8()

Export.image.toAsset({
  image: exportImage,
  description: 'L578_siberia_annualComposites_19972020_v2_cell_'+itile,
  assetId: '_BA/results/L578_siberia_annualComposites_19972020_v2/cell_'+itile,
  scale: 90,
  crs: tile_crs,
  region: roi,
  maxPixels: 10e10
  });
}



if (0){ // exported in descals_geu

var exportImage = POST.addBands(PRE)
  .select(['Blue','Green','SWIR1','Blue_1','Green_1','SWIR1_1'])
  .multiply(0.0001*255*2)
  .addBands(POST.select('year').subtract(1990))
  .uint8()

Export.image.toAsset({
  image: exportImage,
  description: 'Landsat_siberia_annualComposites_OtherBands_19972020_v2_cell_'+itile,
  assetId: 'Landsat_siberia_annualComposites_OtherBands_19972020_v2/cell_'+itile,
  scale: 90,
  crs: tile_crs,
  region: roi,
  maxPixels: 10e10
  });

}


 return 0
})




















