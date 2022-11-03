// Download factors of fires

/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint(),
    geometry2 = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[145.47681953360666, 69.5945616842071],
          [145.47681953360666, 66.59916255096924],
          [156.77076484610686, 66.59916255096924],
          [156.77076484610686, 69.5945616842071]]], null, false),
    geometry3 = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[5.241077637155547, 52.74582838162129],
                  [5.241077637155547, 47.45360257134043],
                  [14.821155762155547, 47.45360257134043],
                  [14.821155762155547, 52.74582838162129]]], null, false),
            {
              "system:index": "0"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

Map.setOptions('satellite')

var visSoS= {min:60 ,max:180, "palette":['ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']};
var visEoS= {min:250 ,max:320, "palette":['ff8d00','fbff00','4aff00','00ffe7','01b8ff','0036ff','fb00ff']};

var scaleOut = 9276.624232772796
var exportRegion = ee.Geometry(ee.Geometry.Rectangle(-180,30,180,78),null,false)
  


var roi_arctic_biomes = ee.FeatureCollection("users/descals_geu/shared/arctic_fires/roi_arctic_biomes_v1");
var roi_arctic = ee.FeatureCollection("users/descals_geu/shared/arctic_fires/roi_arctic_v1");

var watersheds = ee.FeatureCollection('WWF/HydroSHEDS/v1/Basins/hybas_5');
var watersheds = watersheds
  .filterBounds(roi_arctic)
  .map(function(ff){
    return ff.intersection(ee.Feature(roi_arctic.first()), 10)
  });


// var roi = ee.FeatureCollection(geometry2)
var roi = roi_arctic
  
Map.addLayer(roi,{min:0,max:1},'roi',false)

//_______________________________________________________________________________________________________________________
// SECTION   -  CALL AND MERGE GIMMS PHENO MaximumSeparation
var colPHENO30 = ee.ImageCollection("users/descals_geu/LOS_paper/PHENO_GIMMS_NDVI_MS/PHENO_GIMMS_NDVIinterp_snowReclass_MS_p30_wSize60")
var colPHENOall = colPHENO30
  .map(function(im){
    var year = ee.Date(im.get('system:time_start')).get('year') // add year
   return im.set('yy',year)
})


// SECTION   - COMPUTE ENSEMBLE
var listSites = [];
for (var ii=1982; ii<2013; ii++){
  listSites.push(ii)
}

var colPHENOmean = ee.ImageCollection(listSites
  .map(function(yy){
    var colyy = colPHENOall.filter(ee.Filter.eq('yy',yy))
   return colyy.mean().select(['SoS','EoS']).rename(['SoSmean','EoSmean'])
    .set('yy',yy)
    .set('system:time_start',ee.Date.fromYMD(yy,1,1).millis())
}))

// Map.addLayer(colPHENOmean.select('SoSmean').mean(),visSoS,'SoS GIMMS',false)




//_______________________________________________________________________________________________________________________
// SECTION   - MODIS PHENO CREAF
var MODISdescals30 = ee.ImageCollection("users/globaloilpalm/_BA/results/PHENO_MODIS_NDVI_MS/PHENO_MODIS_NDVIinterp_MS_p30_wSize60")
  .filter(ee.Filter.calendarRange(2001, 2020, 'year'));

var colPHENOall = MODISdescals30//.merge(MODISdescals40)
  .map(function(im){
    var year = ee.Date(im.get('system:time_start')).get('year') // add year
   return im.set('yy',year)//.subtract(5)
})


// COMPUTE ENSEMBLE
var listSites = [];
for (var ii=2001; ii<2021; ii++){
  listSites.push(ii)
}

var colPHENOmeanDescals = ee.ImageCollection(listSites
  .map(function(yy){
    var colyy = colPHENOall.filter(ee.Filter.eq('yy',yy))
   return colyy.mean().select(['SoS','EoS']).rename(['SoSmod','EoSmod'])
    .set('yy',yy)
    .set('system:time_start',ee.Date.fromYMD(yy,1,1).millis())
}))


// Map.addLayer(colPHENOmeanDescals.select('SoSmod').mean(),visSoS,'SoS Descals',false)



//_______________________________________________________________________________________________________________________
// SECTION   - Merge PHENO GIMMS and MODIS

var pheno_meanError = colPHENOmean.filter(ee.Filter.calendarRange(2001, 2012, 'year')).mean().subtract(
  colPHENOmeanDescals.filter(ee.Filter.calendarRange(2001, 2012, 'year')).mean())


var colPHENOmeanDescals = colPHENOmeanDescals.map(function(im){
return im.add(pheno_meanError.rename(['SoSmod','EoSmod'])).int().copyProperties(im,['system:time_start'])
})


// print('sos_meanError',pheno_meanError.reduceRegion(ee.Reducer.mean(),roi,scaleOut))


// simple plot
var chart1 = ui.Chart.image.series(colPHENOmean.select('SoSmean').merge(colPHENOmeanDescals.select('SoSmod')), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'SoS', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)

// simple plot
var chart1 = ui.Chart.image.series(colPHENOmean.select('EoSmean').merge(colPHENOmeanDescals.select('EoSmod')), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'EoS', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)


//_______________________________________________________________________________________________________________________
// SECTION   - ERA summer

var years = ee.List.sequence(1982, 2020);

var ERA5 = ee.ImageCollection(years.map(function(yy){
  var ERA5yy = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY") //ee.ImageCollection("ECMWF/ERA5/MONTHLY")
    .filter(ee.Filter.calendarRange(yy, yy, 'year'))
    .filter(ee.Filter.calendarRange(6,8,'month'))
    .map(function(im){
          // VPD
          var ta = im.select(['temperature_2m']).subtract(273.15).rename('ta')
          var td = im.select(['dewpoint_temperature_2m']).subtract(273.15).rename('td')
          // var vpd = ee.Image(0.611)
          //   .multiply( ( (ta.multiply(17.5)).divide(ta.add(240.978))  ).exp() )
          //   .subtract((( (td.multiply(17.5)).divide(td.add(240.978))  ).exp()).multiply(0.611)  )
          //   .rename('vpd') 
            
            
          var vpd = ee.Image(0.6112) .multiply( ( (ta.multiply(17.67)).divide(ta.add(243.5))  ).exp() )
          .subtract(ee.Image(0.6112) .multiply( ( (td.multiply(17.67)).divide(td.add(243.5))  ).exp()) )
          .rename('vpd') 
            

          var CWD = im.select('potential_evaporation').subtract(im.select('evaporation_from_vegetation_transpiration') ).rename('cwd')
       return im.select('temperature_2m').subtract(273.15)
        .addBands(im.select('skin_temperature').subtract(273.15))
        .addBands(im.select('total_precipitation').multiply(1000))
        .addBands(im.select('volumetric_soil_water_layer_2').multiply(1))
        .addBands(vpd)
        .addBands(CWD)
        .addBands(im.select('v_component_of_wind_10m').rename('v_component'))
        .addBands(im.select('u_component_of_wind_10m').rename('u_component'))
        .copyProperties(im,['system:time_start'])
    });

  var ERA5yymean = ERA5yy.mean()
  var ERA5yysum = ERA5yy.sum()
 return ERA5yymean.select(['temperature_2m','vpd','cwd','v_component','u_component','skin_temperature','volumetric_soil_water_layer_2'])
    .addBands(ERA5yysum.select(['total_precipitation']))
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('year',yy)
}))

Map.addLayer(ERA5.select('temperature_2m').toBands(),{min:0,max:1},'ERA5 summer temp',true)
  // simple plot
var chart1 = ui.Chart.image.series(ERA5.select('temperature_2m'), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'ERA ta', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)

  // simple plot
var chart1 = ui.Chart.image.series(ERA5.select('total_precipitation'), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'ERA rf', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)

  // simple plot
var chart1 = ui.Chart.image.series(ERA5.select('vpd'), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'ERA vpd', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)





//_______________________________________________________________________________________________________________________
// SECTION   - MODIS LST SUMMER

var LSTraw = ee.ImageCollection("MODIS/061/MOD11A2").select('LST_Day_1km')
  // .filter(ee.Filter.calendarRange(110, 270, 'day_of_year'))  
  .map(function(im){
    var doy = ee.Date(im.get('system:time_start')).getRelative('day', 'year').add(1);
   return im.rename('LST')
    .multiply(0.02).subtract(273.15)
    .set('doy',doy)
    .copyProperties(im,['system:time_start'])
})


var years = ee.List.sequence(2000, 2020);

var LST_modis = ee.ImageCollection(years.map(function(yy){
    var LSTyy = LSTraw
      .filter(ee.Filter.calendarRange(yy, yy, 'year'))
      .filter(ee.Filter.calendarRange(6,8,'month'))
 return LSTyy.mean()
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('year',yy)
}))



  // simple plot
var chart1 = ui.Chart.image.series(LST_modis, roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'LST_modis summer', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)


var years = ee.List.sequence(1982, 1999);

var emptycol = ee.ImageCollection(years.map(function(yy){
return ee.Image(-999).rename('LST')
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('year',yy)
}))

var LST_modis = LST_modis.merge(emptycol)


//_______________________________________________________________________________________________________________________
// SECTION   - CWD


var years = ee.List.sequence(1982, 2020);

var DROUGHT = ee.ImageCollection(years.map(function(yy){
var DROUGHTyy = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE")
  .filter(ee.Filter.calendarRange(yy, yy, 'year'))
  // .filterDate('1982-01-01','2021-01-01')
  // .select('pdsi')
  // .filter(ee.Filter.eq('month',5))
  .filter(ee.Filter.calendarRange(6,8,'month'))
  .map(function(im){
   return im.select('def').multiply(0.1)
    // .addBands(im.select('vpd').multiply(0.01))
    .copyProperties(im,['system:time_start'])
  });
  // return colMonth.reduce(ee.Reducer.mean())
  //   .set('system:time_start',ee.Date.fromYMD(yy, mm, 1).millis())
  //   .set('empty', colMonth.size().eq(0))
  //   .set('month',mm)
  //   .set('year',yy)})
 return DROUGHTyy.mean()
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    // .set('empty', colMonth.size().eq(0))
    // .set('month',mm)
    .set('year',yy)
}))


// simple plot
var chart1 = ui.Chart.image.series(DROUGHT.select('def'), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'Climate water deficit', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)




//_______________________________________________________________________________________________________________________
// SECTION   - GREENING

var TOC = ee.ImageCollection('NASA/GIMMS/3GV0').map(function(im){
 return im.select('ndvi').updateMask(im.select('qa').eq(1))
  .copyProperties(im,['system:time_start'])
})//.filter(ee.Filter.calendarRange(6,8,'month'))

var years = ee.List.sequence(1982, 2013);

var NDVIavhrr = ee.ImageCollection(years.map(function(yy){
var NDVIim = TOC.select('ndvi') //ee.ImageCollection("ECMWF/ERA5/MONTHLY")
  .filter(ee.Filter.calendarRange(yy, yy, 'year'))
  .filter(ee.Filter.calendarRange(6,8,'month'))
  .map(function(im){
  return im
    .copyProperties(im,['system:time_start'])
  });
return NDVIim.mean()
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    // .set('empty', colMonth.size().eq(0))
    // .set('month',mm)
    .set('year',yy)
}))
  


////////////////////////////////////
var colName = 'MODIS/006/MOD13Q1'
var year1 = 2001;
var year2 = 2020;

var colTarget = ee.ImageCollection(colName)
      .filterDate(year1+'-01-01',(year2+1)+'-01-01')
      .filter(ee.Filter.calendarRange(6,8,'month'))

// ADD TIME STAMP  
var ADD_DATE = function(im){
    var doy = ee.Image(ee.Date(im.get('system:time_start')).getRelative('day', 'year').add(1)).int(); // add doy
    var year = ee.Image(ee.Date(im.get('system:time_start')).get('year')); // add doy
  return im.set('system:time_start',im.get('system:time_start'))
            .addBands(doy)
            .addBands(year);
}

var years = ee.List.sequence(2001, 2020);

var NDVImod = ee.ImageCollection(years.map(function(yy){
var NDVIim = colTarget.select('NDVI') //ee.ImageCollection("ECMWF/ERA5/MONTHLY")
  .filter(ee.Filter.calendarRange(yy, yy, 'year'))
  .filter(ee.Filter.calendarRange(6,8,'month'))
  .map(function(im){
  return im.divide(10000).rename('ndvimod')//.add(0.1)
    .copyProperties(im,['system:time_start'])
  });
return NDVIim.mean()
    .set('system:time_start',ee.Date.fromYMD(yy, 1, 1).millis())
    .set('year',yy)
}))



var greening_meanError = NDVIavhrr.filter(ee.Filter.calendarRange(2001, 2013, 'year')).mean().subtract(
NDVImod.filter(ee.Filter.calendarRange(2001, 2013, 'year')).mean())


var NDVImod = NDVImod.map(function(im){
 return im.add(greening_meanError).copyProperties(im,['system:time_start'])
})

  // simple plot
var chart1 = ui.Chart.image.series( NDVImod.merge(NDVIavhrr), roi, ee.Reducer.mean(), scaleOut)
  .setOptions({title: 'NDVI mean', 
              lineWidth: 0,
              pointSize: 4})
print(chart1)

print('greening_meanError',greening_meanError.reduceRegion(ee.Reducer.mean(),roi,scaleOut))






//_______________________________________________________________________________________________________________________
// SECTION   - EXTRACT DATA

var listSites = [];
for (var ii=1982; ii<2021; ii++){
  listSites.push(ii)
}

// ExportFeatureCollection (from ImCollection) to Drive
var OUTcol = ee.ImageCollection(listSites.map(function(yy) {
    var drought = DROUGHT.filter(ee.Filter.calendarRange(yy,yy,'year')).first()
    var SoSavhrr = colPHENOmean.select('SoSmean').filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('SoS').int()})
    var SoSmod = colPHENOmeanDescals.select('SoSmod').filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('SoS').int()})
    var SoS = (SoSavhrr.merge(SoSmod)).mean().rename('SoS')
    var EoSavhrr = colPHENOmean.select('EoSmean').filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('EoS').int()})
    var EoSmod = colPHENOmeanDescals.select('EoSmod').filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('EoS').int()})
    var EoS = (EoSavhrr.merge(EoSmod)).mean().rename('EoS')
    var NDVIavhrr1 = NDVIavhrr.filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('ndvi')})
    var NDVImod1 = NDVImod.filter(ee.Filter.calendarRange(yy,yy,'year')).map(function(im){ return im.rename('ndvi')})
    var NDVI = (NDVIavhrr1.merge(NDVImod1)).mean().rename('ndvi')
    var ERA = ERA5.filter(ee.Filter.calendarRange(yy,yy,'year')).filter(ee.Filter.calendarRange(yy,yy,'year')).first()
      .select(['temperature_2m','total_precipitation','vpd','v_component','u_component','skin_temperature']).rename(['Ta','Rf','vpd','Vcomp','Ucomp','LSTera5'])
    // var ERA5sp = ERA5spring.filter(ee.Filter.calendarRange(yy,yy,'year')).filter(ee.Filter.calendarRange(yy,yy,'year')).first()
    //   .select(['temperature_2m']).rename(['Ta0'])
    var LST = LST_modis.filter(ee.Filter.calendarRange(yy,yy,'year')).first()
  return drought
    .addBands(ERA)
    // .addBands(ERA5sp)
    .addBands(SoS)
    .addBands(EoS)
    .addBands(NDVI)
    .addBands(LST)
}));


// simple plot
var chart1 = ui.Chart.image.series(OUTcol, roi, ee.Reducer.mean(), scaleOut,'year')
  .setOptions({title: 'DOWNLOAD', 
               lineWidth: 0,
               pointSize: 4})
print(chart1)



// ExportFeatureCollection (from ImCollection) to Drive
var values = OUTcol.map(function(im) {
  return im.reduceRegions(roi, ee.Reducer.mean(), scaleOut)
    .map(function(ff){
     return ff.copyProperties(im)
    })
});

var values = ee.FeatureCollection(values.flatten());

// remove geometries
var values = values.map(function(ff){
 return ee.Feature(ee.Geometry.Point([0,0]),ff.toDictionary())
})


// Export 
Export.table.toDrive({
collection: values,
description:'ARCTIC_TRENDS_Ta_LST_LSTera5_Rf_Vcomp_Ucomp_Vpd_Cwd_SoS_EoS_NDVI_v1',
fileFormat: 'CSV'
});

