// Get your token from https://cesium.com/ion/tokens
//   Cesium.Ion.defaultAccessToken = ''

// Inputs
var online = false

// Create now cesium container
if(online==true){
    // Use imagery, terrain and buildings
    var viewer = new Cesium.Viewer('cesiumContainer',{
        terrainProvider: Cesium.createWorldTerrain(),
    });
    // Add in Open Street Map buildings
    viewer.scene.primitives.add(Cesium.createOsmBuildings());


} else {
    // Stick to default globe
    var viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider : new Cesium.TileMapServiceImageryProvider({url : Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')}),
    baseLayerPicker : false,
    geocoder : false
    });
}



// Clock options
// Set clock multipler of X real time
viewer.clock.multiplier = 30

// Set to animate
viewer.clock.shouldAnimate = true
  