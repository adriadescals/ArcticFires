/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/globaloilpalm/_BA/results/BA_Arctic_FIRMS_perimeters_v1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// var yy = 2008

for (var yy=2001; yy<=2020; yy++){

//_______________________________________________________________________________________________________________________
// SECTION   - Call FIRMS data

var firms = ee.FeatureCollection("users/globaloilpalm/_BA/results/modis_2001-2020_Russian_Federation_ignitions_v1-1")
  .map(function(ff){
    var coords = ff.geometry().centroid(1).coordinates()
    return ff.set('lat',coords.get(1)).set('lon',coords.get(0))
  })
  .filter(ee.Filter.gt('lat',66.5))
  .filter(ee.Filter.gt('lon',85))
  
var ignitions = firms.filter(ee.Filter.eq('status',1))
  .filter(ee.Filter.eq('year',yy));
  
Map.addLayer(ignitions,{min:0,max:1},'LayerName',true)

print(ignitions.size())

var ERA5 = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY")
  .select(['temperature_2m','dewpoint_temperature_2m','total_precipitation_hourly','v_component_of_wind_10m','u_component_of_wind_10m'])
  .filter(ee.Filter.calendarRange(4, 9, 'month'))
  .filter(ee.Filter.calendarRange(yy, yy, 'year'))



// // ADD TIME STAMP  
var ADD_DATE = function(image){
  
  return image.set('system:time_start',image.get('system:time_start'))
            .addBands(image.metadata('system:time_start','date1').divide(86400000));
}

var colTarget = ERA5.map(ADD_DATE);


// MAKE EXTRACTION
var values = colTarget.map(function(i) {
  return i.reduceRegions(ignitions, ee.Reducer.first(), 11131.949079327358); 
});

var values = ee.FeatureCollection(values.flatten());

var values = values.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})

// EXPORT TO DRIVE 
  Export.table.toDrive({
  collection: values,
  description: 'ERA5_ignitions_'+yy, 
  fileFormat: 'CSV'
  });


}

