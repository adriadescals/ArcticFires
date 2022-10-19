


var plotSizes = true

  
for (var randomSeed=0; randomSeed<1; randomSeed++){

var randomSeed = 1234567

//_______________________________________________________________________________________________________________________
// SECTION   - REFERENCE DATASET pre-Olofsson

print('___________ RefDataset SIZES ___________')

  var validationSamples = ee.FeatureCollection('users/globaloilpalm/_BA/validation/ref_dataset_arctic_v2-2')

  print(validationSamples.size())
  print(validationSamples.first())
  
  
  print(validationSamples.filter(ee.Filter.eq('FinalBurn_class',2)).size())
  
  
// var validationSamples = ee.FeatureCollection('users/globaloilpalm/_BA/validation/ref_dataset_arctic_v2-1')
//   .filter(ee.Filter.notNull(['TM_bool','BAMod_bool','Landsat_bool','BAS3_bool','FinalBurn_class']))
//   .filter(ee.Filter.neq('comb',255))
  // .filter(ee.Filter.eq('originalSamples',true))

if (plotSizes){

  print(validationSamples.toList(100))
  print('validationSamples size',validationSamples.size())
  
  print('validationSamples size any burned',validationSamples
    .filter(ee.Filter.or(
      ee.Filter.eq('TM_bool',1),
      ee.Filter.eq('BAMod_bool',1),
      ee.Filter.eq('Landsat_bool',1),
      ee.Filter.eq('BAS3_bool',1)
     )).size())
     
  print('validationSamples size all unburned',validationSamples
    .filter(ee.Filter.and(
      ee.Filter.eq('TM_bool',0),
      ee.Filter.eq('BAMod_bool',0),
      ee.Filter.eq('Landsat_bool',0),
      ee.Filter.eq('BAS3_bool',0)
     )).size())

}


   
Map.addLayer(validationSamples,{min:0,max:1},'refDataset (Original)',false)

//_______________________________________________________________________________________________________________________
// SECTION 1 - reduce density in burned area

var combination_bool = [[1,1,1,1],[1,1,1,0],
  [1,1,0,1],[1,1,0,0],
  [1,0,1,1],[1,0,1,0],
  [1,0,0,1],[1,0,0,0],
  [0,1,1,1],[0,1,1,0],
  [0,1,0,1],[0,1,0,0],
  [0,0,1,1],[0,0,1,0],
  [0,0,0,1],[0,0,0,0]]
  
// var combination_expected = [216,32,134,60,14,3,20,14,11,3,15,15,20,40,57]
var combination_expected = [171,25,106,48,11,2,16,11,9,3,12,12,16,32,45]

var validatedReducedDensityBA = ee.FeatureCollection([])

for (var icomb=0; icomb<combination_expected.length; icomb++){

    var samples_icomb = validationSamples
      .filter(ee.Filter.and(
        ee.Filter.eq('TM_bool',combination_bool[icomb][0]),
        ee.Filter.eq('Landsat_bool',combination_bool[icomb][1]),
        ee.Filter.eq('BAMod_bool',combination_bool[icomb][2]),
        ee.Filter.eq('BAS3_bool',combination_bool[icomb][3])
      ))
    
    
    
    var samples_icomb_selection = ee.FeatureCollection(samples_icomb.randomColumn('random1', randomSeed).sort('random1').toList(combination_expected[icomb]))
  
    if (plotSizes){  
      print(combination_bool[icomb],samples_icomb.size(),samples_icomb_selection.size())
      // print(combination_bool[icomb],samples_icomb.size())
    }
    
    var validatedReducedDensityBA = validatedReducedDensityBA.merge(samples_icomb_selection)
}


//_______________________________________________________________________________________________________________________
// SECTION   - 
print('___________ New RefDataset SIZES ___________')

var nu = validationSamples
  .filter(ee.Filter.and(
    ee.Filter.eq('TM_bool',0),
    ee.Filter.eq('BAMod_bool',0),
    ee.Filter.eq('Landsat_bool',0),
    ee.Filter.eq('BAS3_bool',0)
   ))
   
var validationSamples2 = validatedReducedDensityBA.merge(nu) 


if (plotSizes){  
  print('validationSamples2',validationSamples2.size())
  // print('nu',nu.size())
  
  print('validationSamples2 any BA size',validationSamples2
    .filter(ee.Filter.or(
      ee.Filter.eq('TM_bool',1),
      ee.Filter.eq('BAMod_bool',1),
      ee.Filter.eq('Landsat_bool',1),
      ee.Filter.eq('BAS3_bool',1)
     )).size())
  
  print('validationSamples2 all UN size',validationSamples2
    .filter(ee.Filter.and(
      ee.Filter.eq('TM_bool',0),
      ee.Filter.eq('BAMod_bool',0),
      ee.Filter.eq('Landsat_bool',0),
      ee.Filter.eq('BAS3_bool',0)
     )).size())
}
//_______________________________________________________________________________________________________________________
// SECTION 1 - reduce high density in omitted area

print('___________ New RefDataset Omitted SIZES !!!___________')
var nu_trueUN = nu.filter(ee.Filter.eq('FinalBurn_class',0))
var validatedReducedOmitted = validatedReducedDensityBA.merge(nu_trueUN) 
// Map.addLayer(nu_trueUN,{color:'0000ff'},'nu_trueUN',true)


if (plotSizes){  

  print('validatedReducedOmitted',validatedReducedOmitted.size())
  // print('nu',nu.size())
  
  print('validatedReducedOmitted any BA size',validatedReducedOmitted
    .filter(ee.Filter.or(
      ee.Filter.eq('TM_bool',1),
      ee.Filter.eq('BAMod_bool',1),
      ee.Filter.eq('Landsat_bool',1),
      ee.Filter.eq('BAS3_bool',1)
     )).size())
  
  print('validatedReducedOmitted all UN size',validatedReducedOmitted
    .filter(ee.Filter.and(
      ee.Filter.eq('TM_bool',0),
      ee.Filter.eq('BAMod_bool',0),
      ee.Filter.eq('Landsat_bool',0),
      ee.Filter.eq('BAS3_bool',0)
     )).size())
}






//_______________________________________________________________________________________________________________________
// SECTION  - Create subsets

print('___________ SUBSET SIZES ___________')
// !!!!!!!!!!!!!!!!!!!!
var targetValidated = validationSamples2 //validationSamples2  //validatedReducedDensity //validatedReducedOmitted
// !!!!!!!!!!!!!!!!!!!!

var Uprima_size = [73,76,143,76] // Calculat amb l'excel

//_______________________________________________________________________________________________________________________
// SECTION   - 

print('Total truth class 0',targetValidated.filter(ee.Filter.eq('FinalBurn_class',0)).size())
print('Total truth class 1',targetValidated.filter(ee.Filter.eq('FinalBurn_class',1)).size())
print('Total truth class 2',targetValidated.filter(ee.Filter.eq('FinalBurn_class',2)).size())


print('______________________')
// //_______________________________________________________________________________________________________________________
// // SECTION  - Count samples in U' TREEMAP


var ba = targetValidated
  .filter(ee.Filter.eq('TM_bool',1))
// print(ba)
// Map.addLayer(ba,{color:'0000ff'},'ba',true)

var nu = targetValidated
  .filter(ee.Filter.and(
    ee.Filter.eq('TM_bool',0),
    ee.Filter.eq('BAMod_bool',0),
    ee.Filter.eq('Landsat_bool',0),
    ee.Filter.eq('BAS3_bool',0)
   ))
// print('nu',nu)
// Map.addLayer(nu,{color:'0000ff'},'nu',true)
// Map.addLayer(nu.filter(ee.Filter.eq('FinalBurn_bool',1)),{color:'0000ff'},'nu_trueBA',true)

var nu_prima = targetValidated.filter(ee.Filter.eq('TM_bool',0))
  .filter(ee.Filter.or(
   ee.Filter.eq('BAMod_bool',1),
   ee.Filter.eq('Landsat_bool',1),
   ee.Filter.eq('BAS3_bool',1)
   ))

// print(nu_prima)
// Map.addLayer(nu_prima,{color:'0000ff'},'nu_prima',true)
// // print(targetValidated.filter(ee.Filter.eq('Class',1)).filter(ee.Filter.eq('mean',0)).size())

var nu_prima = nu_prima.randomColumn('random2', randomSeed).sort('random2')
var nu_prima_selection = ee.FeatureCollection(nu_prima.toList(Uprima_size[0]))
var nu_prima_rejected = ee.FeatureCollection(nu_prima.toList(10000,Uprima_size[0]))
// Map.addLayer(nu_prima_selection,{color:'0000ff'},'nu_prima_selection',true)

var validatedsubset1 = ba.merge(nu).merge(nu_prima_selection)
// var validatedsubset1 = ba.merge(nu).merge(nu_prima_selection)

var targetValidated = validatedsubset1.map(function(ff){return ff.set('issubset_TM',1)})
  .merge(nu_prima_rejected.map(function(ff){return ff.set('issubset_TM',0)}))

if (plotSizes){  
  print("TM: B + U + U'",ba.size(),nu.size(),Uprima_size[0])
}











// //_______________________________________________________________________________________________________________________
// // SECTION  - Count samples in U' Landsat



var ba = targetValidated
  .filter(ee.Filter.eq('Landsat_bool',1))
// print(ba)
// Map.addLayer(ba,{color:'0000ff'},'ba',true)

var nu = targetValidated
  .filter(ee.Filter.and(
    ee.Filter.eq('TM_bool',0),
    ee.Filter.eq('BAMod_bool',0),
    ee.Filter.eq('Landsat_bool',0),
    ee.Filter.eq('BAS3_bool',0)
   ))
// print('nu',nu)
// Map.addLayer(nu,{color:'0000ff'},'nu',true)
// Map.addLayer(nu.filter(ee.Filter.eq('FinalBurn_bool',1)),{color:'0000ff'},'nu_trueBA',true)

var nu_prima = targetValidated.filter(ee.Filter.eq('Landsat_bool',0))
  .filter(ee.Filter.or(
   ee.Filter.eq('TM_bool',1),
   ee.Filter.eq('BAMod_bool',1),
   ee.Filter.eq('BAS3_bool',1)
   ))

// print(nu_prima)
// Map.addLayer(nu_prima,{color:'0000ff'},'nu_prima',true)
// // print(targetValidated.filter(ee.Filter.eq('Class',1)).filter(ee.Filter.eq('mean',0)).size())


var nu_prima = nu_prima.randomColumn('random', randomSeed).sort('random')
var nu_prima_selection = ee.FeatureCollection(nu_prima.toList(Uprima_size[1]))
var nu_prima_rejected = ee.FeatureCollection(nu_prima.toList(1000,Uprima_size[1]))
// Map.addLayer(nu_prima_selection,{color:'0000ff'},'nu_prima_selection',true)

var validatedsubset4 = ba.merge(nu).merge(nu_prima_selection)

var targetValidated = validatedsubset4.map(function(ff){return ff.set('issubset_Landsat',1)})
  .merge(nu_prima_rejected.map(function(ff){return ff.set('issubset_Landsat',0)}))

if (plotSizes){  
  print("Landsat: B + U + U'",ba.size(),nu.size(),Uprima_size[1])
}



// //_______________________________________________________________________________________________________________________
// // SECTION  - Count samples in U' MODIS



var ba = targetValidated
  .filter(ee.Filter.eq('BAMod_bool',1))
// print(ba)
// Map.addLayer(ba,{color:'0000ff'},'ba',true)

var nu = targetValidated
  .filter(ee.Filter.and(
    ee.Filter.eq('TM_bool',0),
    ee.Filter.eq('BAMod_bool',0),
    ee.Filter.eq('Landsat_bool',0),
    ee.Filter.eq('BAS3_bool',0)
   ))
// print('nu',nu)
// Map.addLayer(nu,{color:'0000ff'},'nu',true)
// Map.addLayer(nu.filter(ee.Filter.eq('FinalBurn_bool',1)),{color:'0000ff'},'nu_trueBA',true)

var nu_prima = targetValidated.filter(ee.Filter.eq('BAMod_bool',0))
  .filter(ee.Filter.or(
   ee.Filter.eq('TM_bool',1),
   ee.Filter.eq('Landsat_bool',1),
   ee.Filter.eq('BAS3_bool',1)
   ))

// print(nu_prima)
// Map.addLayer(nu_prima,{color:'0000ff'},'nu_prima',true)
// // print(targetValidated.filter(ee.Filter.eq('Class',1)).filter(ee.Filter.eq('mean',0)).size())


var nu_prima = nu_prima.randomColumn('random', randomSeed).sort('random')
var nu_prima_selection = ee.FeatureCollection(nu_prima.toList(Uprima_size[2]))
var nu_prima_rejected = ee.FeatureCollection(nu_prima.toList(1000,Uprima_size[2]))
// Map.addLayer(nu_prima_selection,{color:'0000ff'},'nu_prima_selection',true)

var validatedsubset3 = ba.merge(nu).merge(nu_prima_selection)

var targetValidated = validatedsubset3.map(function(ff){return ff.set('issubset_BAMod',1)})
  .merge(nu_prima_rejected.map(function(ff){return ff.set('issubset_BAMod',0)}))

if (plotSizes){  
  print("BAMod: B + U + U'",ba.size(),nu.size(),Uprima_size[2])
}






// //_______________________________________________________________________________________________________________________
// // SECTION  - Count samples in U' S3



var ba = targetValidated
  .filter(ee.Filter.eq('BAS3_bool',1))
// print(ba)
// Map.addLayer(ba,{color:'0000ff'},'ba',true)

var nu = targetValidated
  .filter(ee.Filter.and(
    ee.Filter.eq('TM_bool',0),
    ee.Filter.eq('BAMod_bool',0),
    ee.Filter.eq('Landsat_bool',0),
    ee.Filter.eq('BAS3_bool',0)
   ))
// print('nu',nu)
// Map.addLayer(nu,{color:'0000ff'},'nu',true)
// Map.addLayer(nu.filter(ee.Filter.eq('FinalBurn_bool',1)),{color:'0000ff'},'nu_trueBA',true)

var nu_prima = targetValidated.filter(ee.Filter.eq('BAS3_bool',0))
  .filter(ee.Filter.or(
   ee.Filter.eq('TM_bool',1),
   ee.Filter.eq('Landsat_bool',1),
   ee.Filter.eq('BAMod_bool',1)
   ))

// print(nu_prima)
// Map.addLayer(nu_prima,{color:'0000ff'},'nu_prima',true)
// // print(targetValidated.filter(ee.Filter.eq('Class',1)).filter(ee.Filter.eq('mean',0)).size())


var nu_prima = nu_prima.randomColumn('random', randomSeed).sort('random')
var nu_prima_selection = ee.FeatureCollection(nu_prima.toList(Uprima_size[3]))
var nu_prima_rejected = ee.FeatureCollection(nu_prima.toList(1000,Uprima_size[3]))
// Map.addLayer(nu_prima_selection,{color:'0000ff'},'nu_prima_selection',true)

var validatedsubset3 = ba.merge(nu).merge(nu_prima_selection)

var targetValidated = validatedsubset3.map(function(ff){return ff.set('issubset_BAS3',1)})
  .merge(nu_prima_rejected.map(function(ff){return ff.set('issubset_BAS3',0)}))

if (plotSizes){  
  print("BAS3: B + U + U'",ba.size(),nu.size(),Uprima_size[2])
}










// //_______________________________________________________________________________________________________________________
// // SECTION  - VALIDATION

print('______ SUBSET VALIDATION (pre-Olofsson) ______')

var datasetsNames = ['TM','Landsat','BAMod','BAS3']
// var datasetsNames = ['TM']

var CMout = ee.FeatureCollection([])
for (var idataset=0; idataset<datasetsNames.length; idataset++){
    
    print('-----'+ datasetsNames[idataset] +'-----')
    
    var targetValidatedSubseti = targetValidated.filter(ee.Filter.eq('issubset_'+datasetsNames[idataset],1))
    
    // print('targetValidatedSubseti',targetValidatedSubseti.size())
    // var targetValidatedSubseti = targetValidatedSubseti
    //   .map(function(ff){
    //   return ff.set('misclassified',ee.Number(ff.get(datasetsNames[idataset]+'_bool')).neq(ee.Number(ff.get('FinalBurn_bool'))))
    //   })
    
    // var palette = ee.List(['000000', 'ff0000']); // number of colors equal to number of classes
    // var colored_samples = targetValidatedSubseti.map(function(ff) {
    //   return ff.set({style: {color: palette.get(ff.get(datasetsNames[idataset]+'_bool')) }})
    // })
    // Map.addLayer(colored_samples.style({styleProperty: "style"}),{},'reference dataset '+datasetsNames[idataset],false)
    
    
    // var palette = ee.List(['00ff00', '0000ff']); // number of colors equal to number of classes
    // var colored_samples = targetValidatedSubseti.map(function(ff) {
    //   return ff.set({style: {color: palette.get(ff.get("misclassified")) }})
    // })
    
    // Map.addLayer(colored_samples.style({styleProperty: "style"}),{},'misclassified '+datasetsNames[idataset],false)
    
    
    print('Map:0 Truth:0',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',0)).filter(ee.Filter.eq('FinalBurn_class',0)).size())
    print('Map:0 Truth:1',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',0)).filter(ee.Filter.eq('FinalBurn_class',1)).size())
    print('Map:0 Truth:2',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',0)).filter(ee.Filter.eq('FinalBurn_class',2)).size())
    print(' ')
    print('Map:1 Truth:0',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',1)).filter(ee.Filter.eq('FinalBurn_class',0)).size())
    print('Map:1 Truth:1',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',1)).filter(ee.Filter.eq('FinalBurn_class',1)).size())
    print('Map:1 Truth:2',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',1)).filter(ee.Filter.eq('FinalBurn_class',2)).size())
    print(' ')
    print('Map:2 Truth:0',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',2)).filter(ee.Filter.eq('FinalBurn_class',0)).size())
    print('Map:2 Truth:1',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',2)).filter(ee.Filter.eq('FinalBurn_class',1)).size())
    print('Map:2 Truth:2',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',2)).filter(ee.Filter.eq('FinalBurn_class',2)).size())
    print(' ')
    
    
    // print('Map:1 Truth:1',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',1)).filter(ee.Filter.eq('FinalBurn_class',1)).size())
    // print('Map:1 Truth:0',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',1)).filter(ee.Filter.eq('FinalBurn_class',0)).size())
    // print('Map:0 Truth:1',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',0)).filter(ee.Filter.eq('FinalBurn_class',1)).size())
    // print('Map:0 Truth:0',targetValidatedSubseti.filter(ee.Filter.eq(datasetsNames[idataset]+'_class',0)).filter(ee.Filter.eq('FinalBurn_class',0)).size())
    
    
    var testAccuracy = targetValidatedSubseti.errorMatrix('FinalBurn_class', datasetsNames[idataset]+'_class');
    print('Confusion matrix: ', testAccuracy);
    // print(ee.List(testAccuracy.array().toList().get(0)).get(0))
    // print(ee.List(testAccuracy.array().toList().get(0)).get(1))
    // print(ee.List(testAccuracy.array().toList().get(1)).get(0))
    // print(ee.List(testAccuracy.array().toList().get(1)).get(1))
    
    var geometry = /* color: #d63000 */ee.Geometry.Point([0,0]);
    var feat1 = ee.Feature(geometry,{
        'CM11': ee.List(testAccuracy.array().toList().get(0)).get(0),
        'CM12': ee.List(testAccuracy.array().toList().get(0)).get(1),
        'CM21': ee.List(testAccuracy.array().toList().get(1)).get(0),
        'CM22': ee.List(testAccuracy.array().toList().get(1)).get(1),
        'dataset': datasetsNames[idataset],
        'idataset': idataset,
        'randomSeed': randomSeed
      })
    var CMout = CMout.merge(ee.FeatureCollection([feat1]))
    // print('Overall accuracy: ', testAccuracy.accuracy());
    // print("Cohen's kappa coefficient : ", testAccuracy.kappa());
    // print('Consumers Accuracy: ', testAccuracy.consumersAccuracy())
    // print('Producers Accuracy: ', testAccuracy.producersAccuracy())
    

}

print('CMout',CMout)
// Export 
Export.table.toDrive({
collection: CMout,
description:'IDN_BA_CMout_seed_'+randomSeed,
folder: 'CMout',
fileFormat: 'CSV'
});

}

var palette = ee.List(['000000', 'ff0000']); // number of colors equal to number of classes
var colored_samples = targetValidated.map(function(ff) {
  return ff.set({style: {color: palette.get(ff.get("FinalBurn_bool")) }})
})
Map.addLayer(colored_samples.style({styleProperty: "style"}),{},'reference dataset (corrected truth)',false)







// //_______________________________________________________________________________________________________________________
// // SECTION  - SAVE Validation subsample

// set Lat Lon properties and sort by longitude
var targetValidated = targetValidated.map(function(ff){
  var coords = ff.geometry().centroid(1).coordinates()
  return ff.set('lat',coords.get(1)).set('lon',coords.get(0))
}).sort('lon').sort('lat')

Export.table.toAsset(targetValidated, 'GEE-REFERENCE_DATASET_Arctic_yy2019-2020_subsamplesOlofsson_TM-S2_TM-Landsat_MODIS_v1', '_BA/validation/REFERENCE_DATASET_Arctic_yy2019-2020_subsamplesOlofsson_TM-S2_TM-Landsat_MODIS_C3SBA10_v2-2')

// Export 
Export.table.toDrive({
collection: targetValidated,
description:'REFERENCE_DATASET_Arctic_yy2019-2020_subsamplesOlofsson_TM-S2_TM-Landsat_MODIS_C3SBA10_v2-2',
fileFormat: 'CSV'
});






