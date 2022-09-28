/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([150.03741722106932, 70.12262017334814]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
///////////////////////////////
// Implementation of the Maximum Separation method in GEE
// Publication in JSTARS: https://doi.org/10.1109/JSTARS.2020.3039554
//
// Adrià Descals - a.descals@creaf.uab.cat
// CREAF - Centre de Recerca Ecològica i Aplicacions Forestals


var textSections = '' +
    " SECTION 0 - Define parameters" +
    "\n SECTION 1 - Declare functions for processing MOD09"+
    "\n SECTION 2 - Declare functions for Maximum Separation method"+
    "\n SECTION 3 - Estimate threshold"+
    "\n SECTION 4 - Estimate ratio of observations above the threshold"+
    "\n SECTION 5 - Extract SoS and EoS"+
    "\n SECTION 6 - Mask water bodies and display pheno maps"+
    "\n SECTION 7 - Plot charts"+
    "\n SECTION 8 - Save results"
    

print(textSections)


//_______________________________________________________________________________________________________________________
// SECTION 0 - Define parameters

Map.setOptions('satellite')

var exportResults = true
var plotResults = false

var wSize = 60 // window size (days)
var th = 0.3 // dynamic threshold (0.5 => 50% of the amplitude)

var point = geometry // Plot charts for region of interest

var scale = 9276.624232772796 // resolution AVHRR
var scaleOut = 9276.624232772796

// var biomeMap = ee.Image('users/descals_geu/TRENDSarctic/RESOLVE_ECOREGIONS_2017_9276m')
// // Map.addLayer(biomeMap,{min:0,max:1},'LayerName',true)
// var biomeMask = biomeMap.eq(11).or(biomeMap.eq(6))
var waterMask = ee.Image('MODIS/006/MOD44W/2015_01_01')
  .select('water_mask')
  .unmask(1)
  .not();
// Map.addLayer(waterMask)

var masks = waterMask //biomeMask.and(waterMask)
Map.addLayer(masks,{min:0,max:1},'masks',false)
//_______________________________________________________________________________________________________________________
// SECTION   - ESTIMATE MIN NDVI FOR SNOW RECLASSIFICATION

var TOCraw = ee.ImageCollection('MODIS/006/MOD13Q1')
  .map(function(im){
    return im.divide(10000).unmask(0).select('NDVI').rename('ndvi')
      .copyProperties(im,['system:time_start'])
    })

var TOCmin = TOCraw.select('ndvi').reduce(ee.Reducer.percentile([5])).rename('ndvi')
// var TOCmax = TOC.select('ndvi').reduce(ee.Reducer.percentile([95])).rename('ndvi')
Map.addLayer(TOCmin,{min:0,max:1},'TOCmin',false)
// Map.addLayer(TOCmax.subtract(TOCmin),{min:0,max:1},'amplitude',false)


//_______________________________________________________________________________________________________________________
// SECTION 1 - CALL DATA

var listYears = [];
for (var ii=2001; ii<2021; ii++){ //1982
  listYears.push(ii)
}

// var listYears = [2019]

var PHENOsim = listYears.map(function(year){
  

var TOC = TOCraw
  .filterDate(ee.Date.fromYMD(year,4,1).advance(-wSize*2, 'day'),ee.Date.fromYMD(year,11,1).advance(wSize*2, 'day'))


// // RECLASSIFY SNOW
// var TOC = TOC.map(function(im){
//     var ndvi = im.select('NDVI').rename('ndvi')
// return ndvi
//   // .where(ndvi.lt(0.01),TOCmin)
//   .where(im.select('SummaryQA').neq(0),TOCmin)
//   .unmask(TOCmin)
//   .copyProperties(im,['system:time_start'])
// })

// simple plot
var chart1 = ui.Chart.image.series(TOC, point, ee.Reducer.mean(), 10)
  .setOptions({title: 'titleGraph', 
               lineWidth: 0,
               pointSize: 4})
// print(chart1)


//_______________________________________________________________________________________________________________________
// SECTION 2 - Declare functions for Maximum Separation method

var covertToBinary = function(im){
  var im2 = im.gt(thresh)
  return im2//.updateMask(im2)
    .set('system:time_start', im.get('system:time_start'))
}

var maskBinary = function(im){
  return im.updateMask(im)
    .set('system:time_start', im.get('system:time_start'))
}


var cubicInterpolation = function(collection,step){ 

  var listDekads = ee.List.sequence(1, collection.size().subtract(3), 1);
  
  var colInterp = listDekads.map(function(ii){
  
  var ii = ee.Number(ii);

  var p0 = ee.Image(collection.toList(10000).get(ee.Number(ii).subtract(1)));
  var p1 = ee.Image(collection.toList(10000).get(ii));
  var p2 = ee.Image(collection.toList(10000).get(ee.Number(ii).add(1)));
  var p3 = ee.Image(collection.toList(10000).get(ee.Number(ii).add(2)));

  var diff01 = ee.Date(p1.get('system:time_start')).difference(ee.Date(p0.get('system:time_start')), 'day');
  var diff12 = ee.Date(p2.get('system:time_start')).difference(ee.Date(p1.get('system:time_start')), 'day');
  var diff23 = ee.Date(p3.get('system:time_start')).difference(ee.Date(p2.get('system:time_start')), 'day');
  
  var diff01nor = diff01.divide(diff12);
  var diff12nor = diff12.divide(diff12);
  var diff23nor = diff23.divide(diff12);
  
  var f0 = p1;
  var f1 = p2;
  var f0p = (p2.subtract(p0)).divide(diff01nor.add(diff12nor));
  var f1p = (p3.subtract(p1)).divide(diff12nor.add(diff23nor));

  var a = (f0.multiply(2)).subtract(f1.multiply(2)).add(f0p).add(f1p);
  var b = (f0.multiply(-3)).add(f1.multiply(3)).subtract(f0p.multiply(2)).subtract(f1p);
  var c = f0p;
  var d = f0;


  /////////////
  var xValues = ee.List.sequence(0,diff12.subtract(1),step); ////!!!!!!!!!!!!!!!
  var xDates = ee.List.sequence(p1.get('system:time_start'),p2.get('system:time_start'),86400000);
  
  var interp = (xValues.map(function(x){
    var im = ee.Image(ee.Number(x).divide(diff12));
    return (im.pow(3)).multiply(a).add((im.pow(2)).multiply(b)).add(im.multiply(c)).add(d)
        .rename(p1.bandNames())
        .set('system:time_start',ee.Number(xDates.get(x)));
    }));
    
   return interp
  })
  
  var colInterp = ee.ImageCollection(colInterp.flatten());

return colInterp
}


//_______________________________________________________________________________________________________________________
// SECTION  - Interpolate time series and make it binary


var TOC = cubicInterpolation(TOC,1)
var chart2 = ui.Chart.image.series(TOC, point, ee.Reducer.first(), scaleOut)
// print(chart2);

//_______________________________________________________________________________________________________________________
// SECTION 3 - Estimate threshold

var bioBandName = 'ndvi'

var amplitude = TOC.select(bioBandName).reduce(ee.Reducer.percentile([95])).subtract(TOC.select(bioBandName).reduce(ee.Reducer.percentile([5])))
var thresh = (amplitude.multiply(th)).add(TOC.select(bioBandName).reduce(ee.Reducer.percentile([5]))).rename('thresh')
  

//_______________________________________________________________________________________________________________________
// SECTION  - Interpolate time series and make it binary

var TOCbinary = TOC.select(bioBandName).map(covertToBinary)

//_______________________________________________________________________________________________________________________
// SECTION 4 - Estimate ratio of observations above the threshold before and after each day of the year


// Define Dates
var lag = 1
var startDate = year+'-01-01'
var endDate = year+'-11-30'
var listDates = ee.List.sequence(ee.Date(startDate).millis(), ee.Date(endDate).millis(), 86400000*lag)

// print(listDates)





// Estimate ratio
var out_diff = ee.ImageCollection(listDates.map(function(dd){
  
  var targetDay = ee.Date(dd);

  //////////  
  // Create Composite Before dd
  var startDate = targetDay.advance(-wSize, 'day')
  var endDate = targetDay

  // var TOC = ee.ImageCollection('NASA/GIMMS/3GV0')
  //       .filterDate(startDate,endDate)
  //       // .filterBounds(ROI)
  //       // .map(prepareTimeSeries)
  //       .map(covertToBinary)
  // var TOC = cubicInterpolation(TOC.select('ndvi'),1)
        
  var median_before = TOCbinary.filterDate(startDate,endDate)
    .reduce(ee.Reducer.mean()).rename(bioBandName)


    
  //////////  
  // Create Composite After dd
  var startDate = endDate
  var endDate = targetDay.advance(wSize, 'day')

  // var TOC = ee.ImageCollection('NASA/GIMMS/3GV0')
  //       .filterDate(startDate,endDate)
  //       // .filterBounds(ROI)
  //       // .map(prepareTimeSeries)
  //       .map(covertToBinary)
  // var TOC = cubicInterpolation(TOC.select('ndvi'),1)
            
  var median_after = TOCbinary.filterDate(startDate,endDate)
    .reduce(ee.Reducer.mean()).rename(bioBandName)


  
  /////////////////////
  // Make difference before and after
  
  var diff_ndvi = (median_after.subtract(median_before))

  var doy = ee.Image(targetDay.getRelative('day', 'year')).rename('doy')
  var out = diff_ndvi.multiply(-1).rename('diff_nd')
    .addBands(diff_ndvi.rename('diff_nd_inv'))
    .addBands(doy.int())

return out.set('system:time_start',targetDay.millis())
}))



//_______________________________________________________________________________________________________________________
// SECTION 5 - Extract SoS and EoS

if (1){ // use this code when time series presents continuous gaps



var EoSdiff = out_diff.filterDate(year+'-08-01',year+'-12-31').max().select('diff_nd').rename('EoS_maxDiff')
var SoSdiff = out_diff.filterDate(year+'-01-01',year+'-07-1').max().select('diff_nd_inv').rename('SoS_maxDiff')

var out_diff_maskedSoS = out_diff.map(function(im){
  var binSoS = im.select('diff_nd_inv').eq(SoSdiff) 
  return im.updateMask(binSoS).copyProperties(im,['system:time_start'])
  })
  

  
var out_diff_maskedEoS = out_diff.map(function(im){
  var binEoS = im.select('diff_nd').eq(EoSdiff) 
    return im.updateMask(binEoS).copyProperties(im,['system:time_start'])
  })

  
  var SoS_multi = out_diff_maskedSoS.select('doy').mean().rename('SoS')
  var EoS_multi = out_diff_maskedEoS.select('doy').mean().rename('EoS')
  
  var countEoS = out_diff_maskedEoS.select('diff_nd').reduce(ee.Reducer.count())
  var countSoS = out_diff_maskedSoS.select('diff_nd_inv').reduce(ee.Reducer.count())
  
  var SoS = out_diff.qualityMosaic('diff_nd_inv').select('doy').rename('SoS')
  var EoS = out_diff.qualityMosaic('diff_nd').select('doy').rename('EoS')
  
  var SoS = SoS.where(countSoS.gte(3),SoS_multi)
  var EoS = EoS.where(countEoS.gte(3),EoS_multi)
  
}else{

  var SoS = out_diff.qualityMosaic('diff_nd_inv').select('doy').rename('SoS')
  var EoS = out_diff.qualityMosaic('diff_nd').select('doy').rename('EoS')
}



//_______________________________________________________________________________________________________________________
// SECTION 6 - Mask water bodies and display pheno maps


var SoS = SoS.updateMask(masks)
var EoS = EoS.updateMask(masks)

var phenoPallete =['ff0000','ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']




//_______________________________________________________________________________________________________________________
// SECTION 7 - Plot charts
if (plotResults){


var chart2 = ui.Chart.image.series(TOCraw.filter(ee.Filter.calendarRange(year, year, 'year')).select('ndvi'), point, ee.Reducer.first(), scale)  
  .setOptions({title: 'MODIS NDVI', 
              lineWidth: 0,
              pointSize: 4})
 print(chart2);

Map.addLayer(SoS.reproject({crs: 'EPSG:4326', scale:scaleOut}) ,{min:60,max:180,palette:phenoPallete},'SoS',false)
Map.addLayer(EoS,{min:200,max:300,palette:phenoPallete},'EoS',false)


var threshdict = thresh.reduceRegion(ee.Reducer.first(), point, scale)
print('thresh:',threshdict.get('thresh'))

var chart1 = ui.Chart.image.series(TOC.select(bioBandName), point, ee.Reducer.first(), scale)
  .setOptions({title: 'MOD09 NDVI', 
              lineWidth: 0,
              pointSize: 4})
print(chart1)

var chart2 = ui.Chart.image.series(TOCbinary, point, ee.Reducer.first(), scale)
  .setOptions({title: 'Binary time series', 
              lineWidth: 0,
              pointSize: 4})
print(chart2)

var chart3 = ui.Chart.image.series(out_diff.select('diff_nd'), point, ee.Reducer.first(), scale)
  .setOptions({title: 'Ratio observations > theshold (after-before)', 
              lineWidth: 0,
              pointSize: 4})
print(chart3)

var init = ee.Image(ee.Date(year+'-01-01').millis());
var SoSdate = (SoS.multiply(86400000)).add(init)
print('Start of Season:',ee.Date(SoSdate.reduceRegion(ee.Reducer.first(), point, scale).get('SoS')))

var EoSdate = (EoS.multiply(86400000)).add(init)
print('End of Season:',ee.Date(EoSdate.reduceRegion(ee.Reducer.first(), point, scale).get('EoS')))


}


//_______________________________________________________________________________________________________________________
// SECTION 8 - Save results


if (exportResults){
  var exportRegion = ee.Geometry(ee.Geometry.Rectangle(-180,50,180,78),null,false)
  // Map.addLayer(exportRegion,{},'exportRegion',false)
  
  var exportImage = SoS.rename('SoS').addBands(EoS.rename('EoS'))
    .set('system:time_start',ee.Date.fromYMD(year,1,1).millis())
    // .reproject({crs: 'EPSG:4326', scale:500})
    // .reproject({crs: 'EPSG:4326', scale:scaleOut})
    .uint16()
  
  Export.image.toAsset({
    image: exportImage,
    description: 'PHENO_MODIS_NDVI_MS_p'+(th*100)+'_wSize'+wSize+'_im'+year,
    assetId: '_BA/results/PHENO_MODIS_NDVI_MS/PHENO_MODIS_NDVIinterp_MS_p'+(th*100)+'_wSize'+wSize+'/im'+year,
    scale: scaleOut,
    crs: 'EPSG:4326',
    region: exportRegion,
    maxPixels:3427747576 
    });
}

 return 0
})