/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var roi3 = 
    /* color: #98ff00 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[74.50075222641257, 67.94419817414916],
          [74.50075222641257, 66.86374857824445],
          [177.50856472641257, 66.86374857824445],
          [177.50856472641257, 67.94419817414916]]], null, false),
    roi2 = 
    /* color: #0b4a8b */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[75.5136254483044, 72.18387976994208],
          [75.5136254483044, 71.10474025850797],
          [157.7792504483044, 71.10474025850797],
          [157.7792504483044, 72.18387976994208]]], null, false),
    roi1 = 
    /* color: #ffc82d */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[87.0272973233044, 75.95395589375023],
          [87.0272973233044, 75.05218244067879],
          [112.0761254483044, 75.05218244067879],
          [112.0761254483044, 75.95395589375023]]], null, false),
    roi4 = 
    /* color: #00ffff */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-177.1464988154505, 67.98949169700964],
          [-177.1464988154505, 66.42381185553793],
          [-170.4668113154505, 66.42381185553793],
          [-170.4668113154505, 67.98949169700964]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/








function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

print(pad(1, 2));  

//
// UTM ZONES
//

var listSites = [];
for (var ii=1; ii<61; ii++){
  listSites.push(pad(ii,2))
}

var ZONE_LON_STARTS=ee.List.sequence(-180,174,6)
var ZONE_INDICES=ee.List(listSites) //ee.List.sequence(1,60)
print(ZONE_INDICES)
var ZONE_DATA=ZONE_INDICES.zip(ZONE_LON_STARTS)
print('ZONE INDEX/LON_START:',ZONE_DATA)
var get_zones=function(index_start){
  index_start=ee.List(index_start)
  var index=ee.Number(index_start.get(0))//.toInt()
  var start=ee.Number(index_start.get(1)).toInt()
  var end=start.add(6)
  var minx=start.min(end)
  var maxx=start.max(end)
  var feat_n=ee.Feature(
    ee.Geometry.Rectangle([minx,0,maxx,84]),
    {
      'crs': ee.String('epsg:326').cat(index),
      'utm': index,
      'nsh': 'N',
     }
  )
  var feat_s=ee.Feature(
    ee.Geometry.Rectangle([minx,-80,maxx,0]),
    {
      'crs': ee.String('epsg:327').cat(index),
      'utm': index,
      'nsh': 'S'
     }
  )
  return ee.FeatureCollection([feat_n,feat_s])
}


var zd=ZONE_DATA.getInfo()
print('good neighbors:',zd[14],zd[16])
var data=zd[15]
var bad_zones=get_zones(data)
print('bad:',data,bad_zones)
var utm_fc=ee.FeatureCollection(ZONE_DATA.map(get_zones)).flatten()

print(utm_fc)
Map.addLayer(utm_fc,null,'UTM ZONES',true,0.5)


var filtArctic = ee.Geometry.Polygon(
        [[[74.94058812376791, 77.7824697795707],
          [74.94058812376791, 66.81959954580103],
          [192.3624631237679, 66.81959954580103],
          [192.3624631237679, 77.7824697795707]]], null, false);
          
var grid = ee.FeatureCollection("users/globaloilpalm/_BA/auxiliary/grid_siberia_ScaleGrid_800000_v3").filterBounds(filtArctic);
Map.addLayer(grid,{min:0,max:1},'grid Siberia',false)



var geometry3 = ee.Geometry.Polygon(
        [[[72, 65],
          [72, 70],
          [180, 70],
          [180, 65]]], null, false);
Map.addLayer(geometry3,{min:0,max:1},'geometry3',true)

var geometry2 = ee.Geometry.Polygon(
        [[[72, 70],
          [72, 74],
          [180, 74],
          [180, 70]]], null, false);
Map.addLayer(geometry2,{min:0,max:1},'geometry2',true)

var geometry1 = ee.Geometry.Polygon(
        [[[72, 74],
          [72, 78],
          [180, 78],
          [180, 74]]], null, false);
Map.addLayer(geometry1,{min:0,max:1},'geometry1',true)

var geometry4 = ee.Geometry.Polygon(
        [[[-180, 65],
          [-180, 70],
          [-168, 70],
          [-168, 65]]], null, false);
Map.addLayer(geometry4,{min:0,max:1},'geometry4',true)



var out1 = utm_fc.map(function(ff){
 return ee.Feature(ff.geometry().intersection(geometry1, ee.ErrorMargin(1)))
  .copyProperties(ff)
}).filterBounds(roi1)

var out2 = utm_fc.map(function(ff){
 return ee.Feature(ff.geometry().intersection(geometry2, ee.ErrorMargin(1)))
  .copyProperties(ff)
}).filterBounds(roi2)

var out3 = utm_fc.map(function(ff){
 return ee.Feature(ff.geometry().intersection(geometry3, ee.ErrorMargin(1)))
  .copyProperties(ff)
}).filterBounds(roi3)

var out4 = utm_fc.map(function(ff){
 return ee.Feature(ff.geometry().intersection(geometry4, ee.ErrorMargin(1)))
  .copyProperties(ff)
}).filterBounds(roi4)


var out = out1.merge(out2).merge(out3).merge(out4)

Map.addLayer(out,{min:0,max:1},'out',true)


// set ID (vectorized)
var out = ee.FeatureCollection(out.toList(out.size()).zip(ee.List.sequence(0, out.size())).map(function(list) {
  list = ee.List(list);
  return ee.Feature(list.get(0)).set('ID', list.get(1));
}));



print(out)
Export.table.toAsset(out, 'grid_arctic_UTM_v1', '_BA/auxiliary/grid_arctic_UTM_v1')

