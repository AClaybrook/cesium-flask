// Get your token from https://cesium.com/ion/tokens
//   Cesium.Ion.defaultAccessToken = ''

// Inputs
var online = true

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

viewer.scene.globe.enableLighting = true;
viewer.scene.postProcessStages.fxaa.enabled = true


// Webpage controls


// 
var camera = viewer.camera
var scene = viewer.scene


// Clock options
var now = new Date().toISOString();
var startDate = now.split('T')[0]
var startTime = new Cesium.JulianDate.fromIso8601(startDate)
function initializeClock(){
    viewer.clock.multiplier = 1 // Multiple of X realtime
    viewer.clock.shouldAnimate = false
    viewer.clockViewModel.currentTime = startTime;
    viewer.timeline.updateFromClock();
}

function setTimeNow(){
  var now = new Date().toISOString();
  var time = new Cesium.JulianDate.fromIso8601(now)
  viewer.clock.multiplier = 1 // Multiple of X realtime
  viewer.clock.shouldAnimate = true
  viewer.clockViewModel.currentTime = time;
  viewer.timeline.updateFromClock();
}

initializeClock()

function addToolbarButton(text, onclick, toolbarID) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'cesium-button';
    button.onclick = function() {
        // reset();
        onclick();
    };
    button.textContent = text;
    document.getElementById(toolbarID || 'toolbar').appendChild(button);
}

function addToolbarMenu(options, toolbarID) {
    var menu = document.createElement('select');
    menu.className = 'cesium-button';
    menu.onchange = function() {
        reset();
        var item = options[menu.selectedIndex];
        if (item && typeof item.onselect === 'function') {
            item.onselect();
        }
    };
    document.getElementById(toolbarID || 'toolbar').appendChild(menu);

    for (var i = 0, len = options.length; i < len; ++i) {
        var option = document.createElement('option');
        option.textContent = options[i].text;
        option.value = options[i].value;
        option.onselect = options[i].onselect;
        menu.appendChild(option);
    }
}


function reset() {
    viewer.dataSources.removeAll();
    viewer.entities.removeAll();
    viewer.scene.primitives.removeAll();
    initializeClock()
}

// Add buttons, the main app.py file serves these urls and are defined in the flask routes
addToolbarButton("Reset", function () {
    reset()
})

addToolbarButton("Set time now", function () {
  setTimeNow()
})


function addCZML(czmlRoute){
  viewer.clock.shouldAnimate = true
  viewer.dataSources.removeAll()
  viewer.dataSources.add(Cesium.CzmlDataSource.load(czmlRoute));
}

addToolbarButton("Czml Datasource", function () {
    addCZML("czml1")
});

addToolbarButton("Lat Lon Val as Polyline", function () {
    async function loadPloyline(jsonFilename){
        const response = await fetch(jsonFilename)
        const data = await response.json()
    
        const valueMin = 0
        const valueMax = 1
        const range = valueMax-valueMin
        const scale = 1/range
        const offset = 0
        const sizeScale = 20/range
        const sizeOffset = 5
        const heightScale = 2000000/range
        const heightOffset = 10000
    
        // Create a polyline collection 
        const polylines = viewer.scene.primitives.add(new Cesium.PolylineCollection());

        for (dataPoint of data){
          // Add a marker for this point
          const {lon,lat,val} = dataPoint
          const scaledVal = (val+valueMin)*scale+offset
          const sizeScaledVal = (val-valueMin)*sizeScale+sizeOffset
          const heightScaledVal = (val-valueMin)*heightScale+heightOffset
    
          const color = Cesium.Color.fromHsl(scaledVal, 0.8, 0.5)
          const surfacePosition = Cesium.Cartesian3.fromDegrees(lon,lat,0);
          const heightPosition = Cesium.Cartesian3.fromDegrees(lon,lat,heightScaledVal);
    
          // // WebGL Globe only contains lines, so that's the only graphics we create.
          // const polyline = new Cesium.PolylineGraphics();
          // polyline.material = new Cesium.ColorMaterialProperty(color);
          // polyline.width = new Cesium.ConstantProperty(5);
          // polyline.arcType = new Cesium.ConstantProperty(Cesium.ArcType.NONE);
          // polyline.positions = new Cesium.ConstantProperty([
          //   surfacePosition,
          //   heightPosition,
          // ]);
    
          // //The polyline instance itself needs to be on an entity.
          // const entity = new Cesium.Entity({
          //   polyline: polyline,
          //   description:`Temp [C] ${val}`,
          // });
    
          // viewer.entities.add(entity)

          const material = Cesium.Material.fromType('Color', {color : color});
          const polylineOptions = {
            material: material,
            width : 5,
            positions : [surfacePosition,heightPosition]
          }
          polylines.add(polylineOptions)
        }
      }


    // Call from url
    reset()
    loadPloyline("/json")

});

addToolbarButton("Lat Lon Alt Val Scatter", function () {
    async function loadScatter(jsonFilename){
        const response = await fetch(jsonFilename)
        const data = await response.json()
    
        
        const valueMin = 0
        const valueMax = 1
        const range = valueMax-valueMin
        const scale = 1/range
        const offset = 0
        const sizeScale = 20/range
        const sizeOffset = 5
    
        const points = viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());

        // viewer.entities.suspendEvents()
        for (dataPoint of data){
          // Add a marker for this point
          const {lon,lat,alt,val} = dataPoint
          const scaledVal = (val+valueMin)*scale+offset
          const sizeScaledVal = (val-valueMin)*sizeScale+sizeOffset
          const color = Cesium.Color.fromHsl(scaledVal, 0.8, 0.5)
  
          const pointOptions = {
            position: Cesium.Cartesian3.fromDegrees(lon,lat,alt),
            color: color,
            pixelSize: 10,
          };
          points.add(pointOptions)
        }

        
        // viewer.entities.resumeEvents()
      }

    // Call from url
    loadScatter("/json")


      

});

addToolbarButton("Lat Lon Alt Val Scatter as Entities", function () {
  async function loadScatterEntities(jsonFilename){
      const response = await fetch(jsonFilename)
      const data = await response.json()
  
      const valueMin = 0
      const valueMax = 1
      const range = valueMax-valueMin
      const scale = 1/range
      const offset = 0
      const sizeScale = 20/range
      const sizeOffset = 5

      // viewer.entities.suspendEvents()
      for (dataPoint of data){
        // Add a marker for this point
        const {lon,lat,alt,val} = dataPoint
        const scaledVal = (val+valueMin)*scale+offset
        const sizeScaledVal = (val-valueMin)*sizeScale+sizeOffset
        const color = Cesium.Color.fromHsl(scaledVal, 0.8, 0.5)
      
        // Add point
        const entity = new Cesium.Entity({
          description:`Lat: ${lon} Lon: ${lat} Alt: ${alt} Val ${val}`,
          position: Cesium.Cartesian3.fromDegrees(lon,lat,alt),
          point: {pixelSize: 10, color: color}
        });

        viewer.entities.add(entity)

      }

      // viewer.entities.resumeEvents()
    }

  // Call from url
  loadScatterEntities("/json")

});

addToolbarButton("Ground Stations", function () {
  async function loadScatterEntities(jsonFilename){
      const response = await fetch(jsonFilename)
      const data = await response.json()
  
      for (dataPoint of data){
        // Add a marker for this point
        const {lon,lat,alt,val,desc} = dataPoint
        const entity = new Cesium.Entity({
          description:`${desc}`,
          position: Cesium.Cartesian3.fromDegrees(lon,lat,alt),
          point: {pixelSize: 10, color: Cesium.Color.WHITE, scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.8, 15000000, 0.5)},
          label: {
            text: `${desc}`,
            translucencyByDistance: new Cesium.NearFarScalar(100000, 1, 4000000, 0.0),
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.8, 15000000, 0.5),
            pixelOffset: new Cesium.Cartesian2(0.0, -30),
            font : "12px Helvetica",
          }                

        });
        viewer.entities.add(entity)
      }
    }

  // Call from url
  loadScatterEntities("/GroundStations")
});

var options = [{text:'data1.czml',value:'val1',onselect:function(){addCZML("czml1")}},
               {text:'data2.czml',value:'val2',onselect: function() {addCZML("czml2")}}]
addToolbarMenu(options) 


