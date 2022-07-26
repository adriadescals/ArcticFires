
Map.setOptions('satellite')



var iversion = '2-1'

//_______________________________________________________________________________________________________________________
// SECTION   - 


// call grid for Siberia
var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");
// Map.addLayer(grid,{min:0,max:1},'grid',true)

var vPoly = ee.Image().byte().paint(grid, 2,4);    
Map.addLayer(vPoly, {palette: '43ffb9', max: 3, opacity: 0.9}, 'Grid Siberia',false); 



var COMP = ee.ImageCollection("users/globaloilpalm/_BA/results/L578_siberia_annualComposites_19972020_v2")
  .mosaic()

var visParams_post = {"opacity":1,"bands":["SWIR2","NIR","Red"],"min":20,"max":120,"gamma":1}
Map.addLayer(COMP,visParams_post,'POST COMP',true)


//_______________________________________________________________________________________________________________________
// SECTION   - 

var listYears = [];
for (var ii=2000; ii<2021; ii++){
  listYears.push(ii)
}


var colTemp1 = ee.ImageCollection('users/globaloilpalm/_BA/results/L578_siberia_annualClassification_19972020_v'+iversion)
var colTemp2 = ee.ImageCollection('users/descals_geu/L578_siberia_annualClassification_19972020_v'+iversion)
var colTemp3 = ee.ImageCollection('users/adriadescals/L578_siberia_annualClassification_19972020_v'+iversion)

var ba2021 = ee.ImageCollection('users/adriadescals/L578_siberia_annualClassification_2021_Mar_Jun_v2-1')

var OUT = colTemp1.merge(colTemp2).merge(colTemp3).merge(ba2021)

var OUT = OUT.map(function(im){
    var index =im.id() // '1_1_yy_1999_cell_32'
    var index_listString = ee.String(index).split('_', 'i') // ["1","1","yy","1999","cell","32"]
    var id = ee.Number.parse(index_listString.get(-1)) // 32 (int)
 return im.set('fileID',index)
  .set('ID',id)
})


var ba_year = ee.ImageCollection(listYears.map(function(yy){
    var outClass = OUT.filter(ee.Filter.eq('yy',yy))
      .mosaic()
      .multiply(yy)
      .int()
return outClass
})).min()

var phenoPallete = ['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff','870085','000000','8A8A8A','FFFFFF']
var VisParam_year = {min:1997,max:2020,"palette":phenoPallete} 
Map.addLayer(ba_year,VisParam_year,'ba_year v'+iversion,true)




var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");
Map.addLayer(grid,{min:0,max:1},'grid Arctic',false)
print(grid)
var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}


var tileIDList = tilesArctic  //tilesArctic //[30] 
// var tileIDList = [33]

var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile))
    
  var tile_crs = roi.first().get('crs')








//_______________________________________________________________________________________________________________________
// SECTION   - Recclasify

var listYears = [];
for (var ii=2001; ii<2021; ii++){
  listYears.push(ii)
}

// var listYears = [2019]


var OUT1 = ee.ImageCollection(listYears.map(function(yy){
  


var ba_year_yy1 = OUT.filter(ee.Filter.eq('yy',yy))
      .mosaic()
      .unmask(0)
      .int()

var ba_year_yy2 = OUT.filter(ee.Filter.eq('yy',yy+1))
      .mosaic()
      .unmask(0)
      .int()

// Map.addLayer(ba_year_yy1,{min:0,max:1},'00 - outClass original',true)

//_______________________________________________________________________________________________________________________
// SECTION   - Reclassify based on FIRMS

var FIRMSmask = ee.ImageCollection("users/globaloilpalm/_BA/results/FIRMS_ArcticMask_1km_20012020_v1").select('yy_'+yy).map(function(im){
 return im.unmask(0).neq(0)
}).max()

// var FIRMSmask = ee.ImageCollection("users/globaloilpalm/_BA/results/FIRMS_ArcticMask_1km_20012020_v1")
//   .select('yy_'+yy)
//   .mosaic()
//   .gt(0)
//   .unmask(0);
// Map.addLayer(FIRMSmask,{min:0,max:1},'FIRMSmask'+yy,true)

var outClass = ba_year_yy1.where(ba_year_yy2.and(FIRMSmask), 1)


var outClass = outClass.updateMask(outClass)

// Map.addLayer(outClass,{min:0,max:1},'01 - outClass reclassified',true)

//_______________________________________________________________________________________________________________________
// SECTION   - clean salt and pepper
 
var saltPepperThreshold=1000;
var outClass=outClass.updateMask(outClass.connectedPixelCount(saltPepperThreshold,true).gte(saltPepperThreshold)
  .or(FIRMSmask)
  );


// Map.addLayer(outClass.reproject({crs: tile_crs, scale:30}),{min:0,max:1},'02 - outClass clean salt-pepper',true)
// Map.setCenter(153.2481, 69.0279,10)










//_______________________________________________________________________________________________________________________
// SECTION -  CREATE COMPOSITES POST
{

// Devine start and end dates
var endDate = ee.Date.fromYMD(2021, 12, 31)
var startDate = ee.Date.fromYMD(2021, 12, 31).advance(-25, 'year')

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



//_______________________________________________________________________________________________________________________
// SECTION   -  MORPHOLOGY
var postImage_nbr = POST.normalizedDifference(['NIR','SWIR1'])

var kernel1 = ee.Kernel.square({radius: 1});
var kernel2 = ee.Kernel.circle({radius: 1});

var outClass = outClass.unmask(0)
  .focal_max({kernel: kernel1, iterations: 1})
  .focal_min({kernel: kernel1, iterations: 1})
  .focal_max({kernel: kernel2, iterations: 1})
  .focal_min({kernel: kernel2, iterations: 1})
  .where(postImage_nbr.gt(-0.1),0)
  .where(outClass,1)
  // .reproject({crs: 'EPSG:32656', scale:20})
  

var outClass = outClass.updateMask(outClass)

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
var burnAreaClean=burnAreaClean.updateMask(burnAreaClean.neq(0))




var outClass = burnAreaClean
  .multiply(yy)
  .subtract(1990)
  .rename('im_'+yy)
  .uint8()

// Map.addLayer(outClass.reproject({crs: tile_crs, scale:30}),{min:0,max:1},'03 - morphology',true)


 return outClass.uint16()
}))

// Map.addLayer(OUT1.reproject({crs: tile_crs, scale:30}) ,VisParam_year,'ba_year corr v'+iversion,true)


var im = OUT1.toBands()
var exportImage = im.rename(im.bandNames().map(function(ii){return ee.String('yy').cat(ee.String(ii))}))
  .uint8()

// print(itile,utmZone)
if (1){
  
        
        // .set('traininingDataset',traininingDataset)
        // .clip(roi.geometry())
  Export.image.toAsset({
    image: exportImage,
    description: 'L578_siberia_annualClassification_19972020_v2-4_post_cell_'+itile,
    assetId: '_BA/results/L578_siberia_annualClassification_19972020_v2-4_post/cell_'+itile,
    scale: 30,
    crs: tile_crs,
    region: roi.geometry(),
    pyramidingPolicy: {'classification': 'mode'},
    maxPixels: 10e10
    });
}


 return 0
})

// var im2col = function(image) {
//   // convert multiband image to image collection
//   function toImageCollection(image) {
//     function selectBand(image) {
//       return function(bandName) {
//         return image.select([bandName])//.rename('mask')
//           // .set('system:time_start',ee.Date.fromYMD(yy,1,1).advance(ee.Number.parse(ee.String(bandName).slice(1)).subtract(1).multiply(4),'day').millis())
//       }
//     }
//     var bandNames = image.bandNames()
//     return ee.ImageCollection.fromImages(bandNames.map(selectBand(image)))
//   }
//   var imageCollection = toImageCollection(image)
// return imageCollection
// };

// var col = im2col(image)

// print(col)
// Map.addLayer(col.mode(),{min:11,max:30},'FIRMSbuffer_im',true)


