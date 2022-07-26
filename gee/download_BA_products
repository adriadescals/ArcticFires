
Map.setOptions('satellite') 



//_______________________________________________________________________________________________________________________
// SECTION   - DEFINE ROI 

var roi_arctic_v1 = ee.FeatureCollection('users/globaloilpalm/_BA/auxiliary/roi_arctic_v1')
var roi_arctic_v1 = ee.FeatureCollection(ee.Feature(roi_arctic_v1.geometry(),{'BIOME':'ALL'}));
Map.addLayer(roi_arctic_v1,{min:0,max:1},'roi_arctic_v1',false)

var ecoregions = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/roi_arctic_biomes_v1")
var ecoregions = ee.FeatureCollection(ecoregions
  .filter(ee.Filter.eq('isArctic',1))
  .geometry()).map(function(ff){ return ff.set('BIOME','Tundra')})



if (0){
  // Peatlands
  var peatland_carbonStorage = ee.Image("users/globaloilpalm/_BA/auxiliary/Histel_SOC_hg_per_sqm")
    .add(ee.Image("users/globaloilpalm/_BA/auxiliary/Histosol_SOC_hg_per_sqm"));
  var visPeat = {"opacity":1,"bands":["b1"],"min":0,"max":200,"palette":["ffffff","00b927"]};

  var peatland_carbonStorage = peatland_carbonStorage.reproject({crs: 'EPSG:4326', scale:10000}) 

  var peatMedian = peatland_carbonStorage.focalMedian(1, 'square', 'pixels', 1)
  var peatland_carbonStorage = peatland_carbonStorage.unmask(0).where(peatland_carbonStorage.unmask(-999).eq(-999),peatMedian)
    .reproject({crs: 'EPSG:4326', scale:10000})
  Map.addLayer(peatland_carbonStorage,visPeat,'peatland_carbonStorage (GDAS projection)',false)

  var exportRegion = ee.Geometry(ee.Geometry.Rectangle(-180,80,180,-60),null,false)
      Export.image.toAsset({
        image: peatland_carbonStorage.rename('SOC').uint32(),
        description: 'Histel_and_histosol_SOC_hg_per_sqm',
        assetId: '_BA/auxiliary/Histel_and_histosol_SOC_hg_per_sqm',
        scale: 10000,
        region: exportRegion,
        maxPixels: 10e10
        });
}else{

  var peatland_carbonStorage = ee.Image("users/globaloilpalm/_BA/auxiliary/Histel_and_histosol_SOC_hg_per_sqm")
  var visPeat = {"min":0,"max":300,"palette":["ffffff","00b927"]};
  Map.addLayer(peatland_carbonStorage,visPeat,'peatland_carbonStorage (GFAS projection)',false)
}
  
    
var peatVector = ee.FeatureCollection(ee.Feature(peatland_carbonStorage.gt(200).rename('peatlands').reduceToVectors({
  geometry: roi_arctic_v1,
  crs: 'EPSG:4326',
  scale: 1000,
  labelProperty: 'peatlands',
  geometryType: 'polygon',
  eightConnected: false,
}).filter(ee.Filter.eq('peatlands',1)).geometry(),{'BIOME':'ORGANIC'}));
Map.addLayer(peatVector,{min:0,max:1},'peatlands',true)


var circumpolar = ee.FeatureCollection(ee.Feature(ee.Geometry(ee.Geometry.Rectangle(-179.9,78,179.9,66.5),null,false),
  {'BIOME':'CIRCUMPOLAR'}));


var roi_arctic_v1_ecoregions = roi_arctic_v1.merge(ecoregions).merge(peatVector).merge(circumpolar)
Map.addLayer(roi_arctic_v1_ecoregions,{min:0,max:1},'roi_arctic_v1_ecoregions',true)



var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_arctic_UTM_v1");

var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}

var grid2 = ee.FeatureCollection(tilesArctic.map(function(itile){
    var tile_geom = grid.filter(ee.Filter.eq('ID',itile))
    var tile_crs = tile_geom.first().get('crs')
    var pixelArea = ee.Image.pixelArea()
    var roi = ee.FeatureCollection(roi_arctic_v1.geometry().intersection(tile_geom, 1))
 return roi.first().copyProperties(tile_geom.first())//.map(function(ff2){ return ff2.copyProperties(tile_geom)})
})).merge(roi_arctic_v1)
  .map(function(ff){
      var areaRoi = ee.Number(ff.area(1)).divide(10000)
   return ff.set('totalArea',areaRoi)
  }).filter(ee.Filter.neq('BIOME','ALL'))

Map.addLayer(grid2,{min:0,max:1},'grid Arctic',false)











//_______________________________________________________________________________________________________________________
// SECTION   - Call Landsat BA Siberia

var listYears = [];
for (var ii=2001; ii<2021; ii++){
  listYears.push(ii)
}

var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}

// var tilesArctic = [33];
var iversionLandsat = '2-4'

var im2col = function(image) {
  // convert multiband image to image collection
  function toImageCollection(image) {
    function selectBand(image) {
      return function(bandName) {
        return image.select([bandName]).set('bandName',bandName).uint8()
          // .set('system:time_start',ee.Date.fromYMD(yy,1,1).advance(ee.Number.parse(ee.String(bandName).slice(1)).subtract(1).multiply(4),'day').millis())
      }
    }
    var bandNames = image.bandNames()
    return ee.ImageCollection.fromImages(bandNames.map(selectBand(image)))
  }
  var imageCollection = toImageCollection(image)
return imageCollection
};


var POST_col = tilesArctic.map(function(itile){
   var im = ee.Image("users/globaloilpalm/_BA/results/L578_siberia_annualClassification_19972020_v"+iversionLandsat+"_post/cell_"+itile)
  var OUT1 = im2col(im)
  
  var OUT1 = OUT1.map(function(im){
        var im = ee.Image(im)
        var index =im.get('bandName') // '1_1_yy_1999_cell_32'
        var index_listString = ee.String(index).split('_', 'i') // ["1","1","yy","1999","cell","32"]
        var id = ee.Number.parse(index_listString.get(-1)) // 32 (int)
    return im.add(1990)
      .rename('ba')//.set('fileID',index)
      .int()
      .set('yy',id)
  })
 return OUT1.toList(1000)//.min()
})//.flatten()

var POST_col = ee.ImageCollection(ee.List(POST_col).flatten())


var ba_year_landsat = ee.ImageCollection(listYears.map(function(yy){
    var outClass = POST_col.filter(ee.Filter.eq('yy',yy))
      .mosaic()
      .rename('ba')
      .gt(0)
      .multiply(yy)
      .subtract(1990)
      .int()
 return outClass.set('yy',yy)
}))//.min()//.updateMask(waterMask)

var ba_year_landsat = ba_year_landsat.min()
var ba_year_landsat = ba_year_landsat.updateMask(ba_year_landsat.gte(23))

var classVisParam = {"min":29,"max":30,"palette":["4aff00","00cccb"]};
Map.addLayer(ba_year_landsat,classVisParam,'Landsat post v'+iversionLandsat,false)


//_______________________________________________________________________________________________________________________
// SECTION   - Call Sentinel-2

var classVisParam = {"min":29,"max":30,"palette":["ff0000","ff00ff"]};

var iversionS2 = '9-2-4'

var outClass2019 = ee.ImageCollection("users/annaobla/S2_siberia_annualClassification_20192020_v"+iversionS2+"_post").filter(ee.Filter.eq('yy',2019)).mosaic().multiply(29).uint8();
var outClass2020 = ee.ImageCollection("users/annaobla/S2_siberia_annualClassification_20192020_v"+iversionS2+"_post").filter(ee.Filter.eq('yy',2020)).mosaic().multiply(30).uint8();
var ba_year_s2 = ee.ImageCollection.fromImages([outClass2019,outClass2020]).min()
Map.addLayer(ba_year_s2,classVisParam,'Sentinel-2 v'+iversionS2+" post",false);


//_______________________________________________________________________________________________________________________
// SECTION   - MODIS product
var VisParam_year = {min:29,max:30,"palette":['8A8A8A','FFFFFF']} 

var listYears = [];
for (var ii=2001; ii<2021; ii++){
  listYears.push(ii)
}

var OUT = listYears.map(function(yy){
  var bandName = 'im'+yy
  var col = ee.ImageCollection("MODIS/006/MCD64A1")
    .filter(ee.Filter.calendarRange(yy, yy, 'year'))
  var im = col.max().gt(0).select('BurnDate')
 return im.rename(bandName.slice(2))
  .set('system:time_start',ee.Date.fromYMD(yy,1,1).millis())
  .set('yy',yy)
})

var ba_year_MODIS = ee.ImageCollection(OUT)
 
print('MCD64A1 scale',ee.ImageCollection("MODIS/006/MCD64A1").first().projection().nominalScale())
print('MCD64A1 crs',ee.ImageCollection("MODIS/006/MCD64A1").first().projection().crs())


var pixelArea = ee.Image.pixelArea()
var areaIm = ba_year_MODIS.toBands().multiply(pixelArea).divide(10000)//.updateMask(peatland_carbonStorage.gt(100)) 
  .rename(['2001','2002','2003','2004','2005','2006','2007','2008','2009',
  '2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020'])
var valuesMCD64A1 = areaIm.reduceRegions(roi_arctic_v1_ecoregions, ee.Reducer.sum(), 463.3127165275, 'SR-ORG:6974'); 
// var valuesMCD64A1 = areaIm.reduceRegions(roi_arctic_v1, ee.Reducer.sum(), 249.9938659391174, 'EPSG:4326'); 

var valuesMCD64A1 = valuesMCD64A1.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})

Export.table.toDrive({
collection: valuesMCD64A1, 
description:'Arctic_BA_MCD64A1',
fileFormat: 'CSV',
folder: 'Arctic_BA_allYears2'
});




//_______________________________________________________________________________________________________________________
// SECTION   - MODIS CCI product

var listYears = [];
for (var ii=2001; ii<2020; ii++){
  listYears.push(ii)
}

var ba_CCI = ee.ImageCollection(listYears.map(function(yy){
  var col = ee.ImageCollection("ESA/CCI/FireCCI/5_1")
    .filter(ee.Filter.calendarRange(yy, yy, 'year')).map(function(im){
     return im.updateMask(im.select('ConfidenceLevel').gt(50))
      .copyProperties(im,['system:time_start'])
    })
  var im = col.reduce(ee.Reducer.count()).gt(0).select('BurnDate_count').uint8() //.multiply(yy).subtract(1990).gt(0).uint8()
return im.set('system:time_start',ee.Date.fromYMD(yy,1,1).millis())
  .set('yy',yy)
}))


var yyVis = 2019
var phenoPallete = ['0000ff']
var VisParam_year = {min:1997,max:2020,"palette":phenoPallete} 
Map.addLayer(ba_CCI.filter(ee.Filter.eq('yy',yyVis)).first().clip(roi_arctic_v1),VisParam_year,'FireCCI51 '+yyVis,false);



print('FireCCI51 scale',ee.ImageCollection("ESA/CCI/FireCCI/5_1").select('BurnDate').first().projection().nominalScale())
print('FireCCI51 crs',ee.ImageCollection("ESA/CCI/FireCCI/5_1").select('BurnDate').first().projection().crs())

var pixelArea = ee.Image.pixelArea()
var areaIm = ba_CCI.toBands().multiply(pixelArea).divide(10000)//.updateMask(peatland_carbonStorage.gt(100))   
  .rename(['2001','2002','2003','2004','2005','2006','2007','2008','2009',
  '2010','2011','2012','2013','2014','2015','2016','2017','2018','2019'])
var valuesFIRECCI51 = areaIm.reduceRegions(roi_arctic_v1_ecoregions, ee.Reducer.sum(), 249.9938659391174, 'EPSG:4326'); 

var valuesFIRECCI51 = valuesFIRECCI51.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})

Export.table.toDrive({
collection: valuesFIRECCI51, 
description:'Arctic_BA_FireCCI51',
fileFormat: 'CSV',
folder: 'Arctic_BA_allYears2'
});







//_______________________________________________________________________________________________________________________
// SECTION   - C3SBA10


var listYears = [];
for (var ii=2017; ii<2021; ii++){
  listYears.push(ii)
}

var C3SBA10 = ee.ImageCollection(listYears.map(function(yy){
  var im5 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_'+yy+'_05').gt(0)
  var im6 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_'+yy+'_06').gt(0)
  var im7 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_'+yy+'_07').gt(0)
  var im8 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_'+yy+'_08').gt(0)
  var im9 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_'+yy+'_09').gt(0)
  
  var cl_tresh = 50
  var cl5 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI_ConfideceLevel/CL_L3S_FIRE-BA-OLCI_'+yy+'_05').gt(cl_tresh)
  var cl6 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI_ConfideceLevel/CL_L3S_FIRE-BA-OLCI_'+yy+'_06').gt(cl_tresh)
  var cl7 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI_ConfideceLevel/CL_L3S_FIRE-BA-OLCI_'+yy+'_07').gt(cl_tresh)
  var cl8 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI_ConfideceLevel/CL_L3S_FIRE-BA-OLCI_'+yy+'_08').gt(cl_tresh)
  var cl9 = ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI_ConfideceLevel/CL_L3S_FIRE-BA-OLCI_'+yy+'_09').gt(cl_tresh)
  
  var out = ee.ImageCollection.fromImages([im5.updateMask(cl5),im6.updateMask(cl6),im7.updateMask(cl7),im8.updateMask(cl8),im9.updateMask(cl9)])
    .max()
    // .multiply(yy)
    .rename('BA')
    .set('yy',yy)
    .int()
    
  // Map.addLayer(out.updateMask(out),{palette:'ff0000'},'BA S3 '+yy,true);
 return out.updateMask(out)
}))

var yyVis = 2019
var phenoPallete = ['ff0000']
var VisParam_year = {min:1997,max:2020,"palette":phenoPallete} 
Map.addLayer(C3SBA10.filter(ee.Filter.eq('yy',yyVis)).first().clip(roi_arctic_v1),VisParam_year,'C3SBA10 '+yyVis,false);

print('OLCI scale',ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_2018_09').projection().nominalScale())
print('OLCI crs',ee.Image('users/globaloilpalm/_BA/auxiliary/L3S_FIRE-BA-OLCI/JD_L3S_FIRE-BA-OLCI_2018_09').projection().crs())

var pixelArea = ee.Image.pixelArea()
var areaIm = C3SBA10.toBands().multiply(pixelArea).divide(10000)//.updateMask(peatland_carbonStorage.gt(100)) 
  .rename(['2017','2018','2019','2020'])
var valuesS3 = areaIm.reduceRegions(roi_arctic_v1_ecoregions, ee.Reducer.sum(), 309.1916611624561, 'EPSG:4326'); 

var valuesS3 = valuesS3.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})

Export.table.toDrive({
collection: valuesS3, 
description:'Arctic_BA_C3SBA10',
fileFormat: 'CSV',
folder: 'Arctic_BA_allYears2'
});







//_______________________________________________________________________________________________________________________
// SECTION   - AVHRR

var listYears = [];
for (var ii=1982; ii<2019; ii++){
  listYears.push(ii)
}

var BA = ee.Image("users/globaloilpalm/_BA/auxiliary/ESACCI-L3S_FIRE-BA-AVHRR-LTDR-fv1-1_BA");
var CL = ee.Image("users/globaloilpalm/_BA/auxiliary/ESACCI-L3S_FIRE-BA-AVHRR-LTDR-fv1-1_CL");
Map.addLayer(BA,{min:0,max:1},'AVHRR',false)

print('AVHRR scale',BA.projection().nominalScale())
print('AVHRR crs',BA.projection().crs())

var BA_AVHRR = ee.ImageCollection(listYears.map(function(yy){
  var cl_mask = CL.select('b'+(yy-1981)).gt(0)
  var out = BA.select('b'+(yy-1981))
    .updateMask(cl_mask)
    // .multiply(yy)
    .rename('BA')
    .set('yy',yy)
    // print(out)
 return out
}))


var pixelArea = ee.Image.pixelArea()
var areaIm = BA_AVHRR.toBands().divide(10000)//.updateMask(peatland_carbonStorage.gt(100)) 
  .rename(listYears.map(function(yy){ return ''+yy}))

var valuesAVHRR = areaIm.reduceRegions(roi_arctic_v1_ecoregions, ee.Reducer.sum(), 5565.974539663679, 'EPSG:4326'); 

var emptyPoint = ee.Geometry.Point([0,0]);
var valuesAVHRR = valuesAVHRR.map(function(ff){
   return ff.set('2019','').set('2020','')
  })
  
var valuesAVHRR = valuesAVHRR.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})

Export.table.toDrive({
collection: valuesAVHRR, 
description:'Arctic_BA_FireCCILT11',
fileFormat: 'CSV',
folder: 'Arctic_BA_allYears2'
});







// ________________________________________
// SECTION   - Download Sentinel-2 and LANDSAT area




// ________________________________________
// SECTION   - 

var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}
 
// var tilesArctic = [27,30];

var OUT2 = tilesArctic.map(function(itile){
    var tile_geom = grid2.filter(ee.Filter.eq('ID',itile))
    var tile_crs = tile_geom.first().get('crs')
  
  //________________________________________________________
  // Estimate AREA in m2 and export to Drive
  var pixelArea = ee.Image.pixelArea()
  
  var roi = ee.FeatureCollection(roi_arctic_v1.geometry().intersection(tile_geom, 1)).map(function(ff){ return ff.set('BIOME','ALL')})
    .merge(ee.FeatureCollection(ecoregions.geometry().intersection(tile_geom, 1)).map(function(ff){ return ff.set('BIOME','Tundra')}))
    .merge(ee.FeatureCollection(peatVector.geometry().intersection(tile_geom, 1)).map(function(ff){ return ff.set('BIOME','ORGANIC')}))
  // Map.addLayer(roi,{},'roi',true)
  
  
  // Sentinel-2 /////////////////////////
  var ba = ba_year_s2.unmask(0)
  var areaIm = ba.eq(29).rename('2019').multiply(pixelArea) 
    .addBands(ba.eq(30).rename('2020').multiply(pixelArea)) 
  var values = areaIm.reduceRegions(roi, ee.Reducer.sum(), 10, tile_crs); 
  
  if (0){
    Export.table.toDrive({
    collection: values, 
    description: 'Arctic_BA_S2_2019-2020_cell_'+itile,
    fileFormat: 'CSV',
    folder: 'S2_Landsat_R1'
    });
  }
  
  // Landsat /////////////////////////
  var ba = ba_year_landsat.unmask(0)
  var areaIm = ba.eq(23).rename('2013').multiply(pixelArea) 
    // .addBands(ba.eq(9).rename('1998').multiply(pixelArea)) 
    // .addBands(ba.eq(8).rename('1999').multiply(pixelArea)) 
    // .addBands(ba.eq(10).rename('2000').multiply(pixelArea)) 
    // .addBands(ba.eq(11).rename('2001').multiply(pixelArea)) 
    // .addBands(ba.eq(12).rename('2002').multiply(pixelArea)) 
    // .addBands(ba.eq(13).rename('2003').multiply(pixelArea)) 
    // .addBands(ba.eq(14).rename('2004').multiply(pixelArea)) 
    // .addBands(ba.eq(15).rename('2005').multiply(pixelArea)) 
    // .addBands(ba.eq(16).rename('2006').multiply(pixelArea)) 
    // .addBands(ba.eq(17).rename('2007').multiply(pixelArea)) 
    // .addBands(ba.eq(18).rename('2008').multiply(pixelArea)) 
    // .addBands(ba.eq(19).rename('2009').multiply(pixelArea)) 
    // .addBands(ba.eq(20).rename('2010').multiply(pixelArea)) 
    // .addBands(ba.eq(21).rename('2011').multiply(pixelArea)) 
    // .addBands(ba.eq(22).rename('2012').multiply(pixelArea)) 
    // .addBands(ba.eq(23).rename('2013').multiply(pixelArea)) 
    .addBands(ba.eq(24).rename('2014').multiply(pixelArea)) 
    .addBands(ba.eq(25).rename('2015').multiply(pixelArea)) 
    .addBands(ba.eq(26).rename('2016').multiply(pixelArea)) 
    .addBands(ba.eq(27).rename('2017').multiply(pixelArea)) 
    .addBands(ba.eq(28).rename('2018').multiply(pixelArea)) 
    .addBands(ba.eq(29).rename('2019').multiply(pixelArea)) 
    .addBands(ba.eq(30).rename('2020').multiply(pixelArea)) 
  var values = areaIm.reduceRegions(roi, ee.Reducer.sum(), 10, tile_crs); 
  
  if (0){
    Export.table.toDrive({
    collection: values, 
    description: 'Arctic_BA_Landsat_2013-2020_cell_'+itile,
    fileFormat: 'CSV',
    folder: 'S2_Landsat_R1'
    });
  }

 return 0
})






//_______________________________________________________________________________________________________________________
// SECTION   - Export Sentinel-2 and Landsat BA images

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


var tilesArctic = [];
for (var ii=0; ii<40; ii++){
  tilesArctic.push(ii)
}
 
var tileIDList = tilesArctic
var tileIDList = [32,33]


var OUT2 = tileIDList.map(function(itile){
    
    var roi = grid.filter(ee.Filter.eq('ID',itile))
    var tile_crs = roi.first().get('crs')

// Sentinel-2
if (0){
  ee.String(tile_crs).evaluate(function(str) {

  // Export the image to Drive.
   Export.image.toDrive({
    image: ba_year_s2.uint8(),
    description: 'Arctic_BA_Sentinel2_2019-2020_tile-'+pad(itile, 2)+'_v'+iversionS2,
    scale: 30,
    crs: str,
    region: roi.geometry(),
    maxPixels:10e10,
    folder: 'Arctic_BA_Sentinel2_v2'
    });

  })
}


// Landsat
if (0){
  ee.String(tile_crs).evaluate(function(str) {

  // Export the image to Drive.
   Export.image.toDrive({
    image: ba_year_landsat.uint8(),
    description: 'Arctic_BA_Landsat78_2013-2020_tile-'+pad(itile, 2)+'_v'+iversionLandsat,
    scale: 30,
    crs: str,
    region: roi.geometry(),
    maxPixels:10e10,
    folder: 'Arctic_BA_Landsat78'
    });

  })
}
 
 return 0
})







//_______________________________________________________________________________________________________________________
// SECTION   - Arctic line

var arcticLine = /* color: #d63000 */ee.Geometry.LineString(
        [[-179.9, 66.5],
         [179.9, 66.5]],'EPSG:4326',false);
Map.addLayer(arcticLine,{color:'dc9a9a'},'Arctic line',false)











