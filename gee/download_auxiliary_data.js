
var sampleRCP = ee.Image('users/globaloilpalm/_BA/auxiliary/sample_image_RCP_hadgem2')
Map.addLayer(sampleRCP,{min:-40,max:-7},'sampleRCP',false)

print(sampleRCP.projection().crs())
print(sampleRCP.projection().nominalScale())

var exportRegion = ee.Geometry(ee.Geometry.Rectangle(-179.7500,83.7500,179.7500,-83.7500),null,false)
Map.addLayer(exportRegion,{min:0,max:1},'exportRegion',false)

var scale = 55659.7453966// 0.5° 

//_______________________________________________________________________________________________________________________
// SECTION   - Download ROI Arctic

var roi_arctic = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/roi_arctic_v1")
  .map(function(ff){
   return ff.set('empty',1)
  });

var roi_arctic_im = roi_arctic
  .reduceToImage({
    properties: ['empty'],
    reducer: ee.Reducer.first()
}).unmask(0);

Map.addLayer(roi_arctic_im,{min:0,max:1},'roi_arctic_im',false)


// Export the image to Drive.
Export.image.toDrive({
  image: roi_arctic_im.uint8(),
  description: 'roi_arctic_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });



//_______________________________________________________________________________________________________________________
// SECTION   - Download biomes Arctic

var roi_arctic_biomes = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/roi_arctic_biomes_v1")
  .map(function(ff){
   return ff.set('empty',1)
  });
  
var roi_arctic_biomes_im = roi_arctic_biomes
  .reduceToImage({
    properties: ['isArctic'],
    reducer: ee.Reducer.first()
}).add(1).unmask(0);

Map.addLayer(roi_arctic_biomes_im,{min:0,max:2},'roi_arctic_biomes_im',false)

// Export the image to Drive.
Export.image.toDrive({
  image: roi_arctic_biomes_im.uint8(),
  description: 'roi_arctic_biomes_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });


//_______________________________________________________________________________________________________________________
// SECTION   - Download peatlands SOC

var peatland_carbonStorage = ee.Image("users/globaloilpalm/_BA/auxiliary/Histel_and_histosol_SOC_hg_per_sqm")
var visPeat = {"min":0,"max":300,"palette":["ffffff","00b927"]};
Map.addLayer(peatland_carbonStorage,visPeat,'peatland_carbonStorage (GFAS projection)',false)

// Export the image to Drive.
Export.image.toDrive({
  image: peatland_carbonStorage.uint32(),
  description: 'peatland_SOC_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });




//_______________________________________________________________________________________________________________________
// SECTION   - Download ERA summer

var years = ee.List.sequence(1982, 2020);

var ERA5all = ee.ImageCollection(years.map(function(yy){
  var ERA5yy = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY") //ee.ImageCollection("ECMWF/ERA5/MONTHLY")
    .filter(ee.Filter.calendarRange(yy, yy, 'year'))
    .filter(ee.Filter.calendarRange(6,8,'month'))
    .map(function(im){
          var ta = im.select('temperature_2m').subtract(273.15)
          var td = im.select('dewpoint_temperature_2m').subtract(273.15)
          var vpd = ee.Image(0.6112) .multiply( ( (ta.multiply(17.67)).divide(ta.add(243.5))  ).exp() )
            .subtract(ee.Image(0.6112) .multiply( ( (td.multiply(17.67)).divide(td.add(243.5))  ).exp()) )
            .rename('vpd') 
            
       return im.select('temperature_2m').addBands(vpd).multiply(1000)
        .copyProperties(im,['system:time_start'])
    });
  var ERA5yymean = ERA5yy.mean()
 return ERA5yymean
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('year',yy)
}))

var ERA5 = ERA5all.select('temperature_2m').toBands()
var ERA5 = ERA5.rename(ERA5.bandNames().map(function(ii){return ee.String('im').cat(ee.String(ii))}))
// Export the image to Drive.
Export.image.toDrive({
  image: ERA5.uint32(),
  description: 'ERA5_TA_1982-2020_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });

var ERA5 = ERA5all.select('vpd').toBands()
var ERA5 = ERA5.rename(ERA5.bandNames().map(function(ii){return ee.String('im').cat(ee.String(ii))}))
// Export the image to Drive.
Export.image.toDrive({
  image: ERA5.uint32(),
  description: 'ERA5_VPD_1982-2020_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });








//_______________________________________________________________________________________________________________________
// SECTION   - 

if (0){
  var latlon = ee.Image.pixelLonLat()
  var latlon = latlon.select('longitude').add(latlon.select('latitude')).multiply(10000).int()
  var grid = latlon.reduceToVectors({
    geometry: ee.Geometry(ee.Geometry.Rectangle(-180,84,180,-84),null,false),
    crs: sampleRCP.projection(),
    scale: scale,
    geometryType: 'polygon',
    eightConnected: false,
    labelProperty: 'b1'
  });

  var grid = grid.filterBounds(roi_arctic)
  Export.table.toAsset(grid, 'grid_05degrees', '_BA/auxiliary/grid_05degrees')

}else{
  var grid = ee.FeatureCollection('users/globaloilpalm/_BA/auxiliary/grid_05degrees')
}


var firms = ee.FeatureCollection("users/globaloilpalm/_BA/results/modis_2001-2020_Russian_Federation_ignitions_v1-1")
  .map(function(ff){
    var coords = ff.geometry().centroid(1).coordinates()
    return ff.set('lat',coords.get(1)).set('lon',coords.get(0))
  })
  // .filter(ee.Filter.gt('lat',66.5))
  // .filter(ee.Filter.gt('lon',85))
var ignitions = firms.filter(ee.Filter.eq('status',1))


var grid = grid.map(function(ff){
    var count_ignitions = ignitions.filterBounds(ff.geometry()).size() 
   return ff.set('count_ignitions',count_ignitions)
  })

var count_ignitions = grid
  .reduceToImage({
    properties: ['count_ignitions'],
    reducer: ee.Reducer.first()
}).divide(19);

Map.addLayer(count_ignitions,{min:0,max:1,palette:['black','yellow','red','magenta']},'count_ignitions',false)

var count_ignitions_mean = count_ignitions.focalMean(2, 'circle', 'pixels')
  .reproject({crs: 'EPSG:4326', scale:scale}) 
  .updateMask(count_ignitions.unmask(-1).neq(-1))
Map.addLayer(count_ignitions_mean,{min:0,max:1.5,palette:['black','yellow','red','magenta']},'count_ignitions_mean',false)

var count_ignitions_std = count_ignitions.focalMean(2, 'circle', 'pixels')
  .reproject({crs: 'EPSG:4326', scale:scale}) 
  .updateMask(count_ignitions.unmask(-1).neq(-1))
Map.addLayer(count_ignitions_std,{min:0,max:0.2,palette:['black','yellow','red','magenta']},'count_ignitions_std',false)


// Export the image to Drive.
var exportImage = count_ignitions.addBands(count_ignitions_mean).addBands(count_ignitions_std)
Export.image.toDrive({
  image: exportImage,
  description: 'ignitions_2001-2020_mean_spatialmean_spatialstd_01degrees',
  scale: scale,
  region: exportRegion,
  maxPixels:10e10
  });


Map.addLayer(ignitions,{color:'green'},'ignitions',false)



//_______________________________________________________________________________________________________________________
// SECTION   - Download ROI Arctic for CAPE


var roi_arctic = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/roi_arctic_v1")
  .map(function(ff){
   return ff.set('empty',1)
  });

var roi_arctic_im = roi_arctic
  .reduceToImage({
    properties: ['empty'],
    reducer: ee.Reducer.first()
}).unmask(0);

// Export the image to Drive.
Export.image.toDrive({
  image: roi_arctic_im.uint8(),
  description: 'roi_arctic_CAPE',
  scale: 27660.343963530868,
  region: roi_arctic.geometry().bounds(),
  maxPixels:10e10
  });






