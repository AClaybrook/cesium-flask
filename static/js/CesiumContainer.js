// Get your token from https://cesium.com/ion/tokens
//   Cesium.Ion.defaultAccessToken = ''

// Inputs
var online = false

// Create now cesium container
if(online==true){
    // Use imagery, terrain and buildings
    var viewer = new Cesium.Viewer('cesiumContainer',{
        // terrainProvider: Cesium.createWorldTerrain(),
        // baseLayerPicker: false,
    });
    // Add in Open Street Map buildings
    // viewer.scene.primitives.add(Cesium.createOsmBuildings());

} else {
    // Stick to default globe
    var viewer = new Cesium.Viewer('cesiumContainer',{
    imageryProvider : new Cesium.TileMapServiceImageryProvider({url : Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')}),
    baseLayerPicker : false,
    geocoder : false
    });
}



// 
var camera = viewer.camera
var scene = viewer.scene
var layers = viewer.scene.imageryLayers;

scene.globe.enableLighting = true;
scene.postProcessStages.fxaa.enabled = true

// // Add event listener, which transforms the camera postion to icrf
// function icrf(scene, time) {
//   if (scene.mode !== Cesium.SceneMode.SCENE3D) {
//     return;
//   }

//   const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
//   if (Cesium.defined(icrfToFixed)) {
//     const camera = viewer.camera;
//     const offset = Cesium.Cartesian3.clone(camera.position);
//     const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
//     camera.lookAtTransform(transform, offset);
//   }
// }

// scene.postUpdate.addEventListener(icrf);

// console.log(layers.get(0))
// var tileLayer = layers.addImageryProvider(new Cesium.SingleTileImageryProvider({url: '/image'}));
// tileLayer.alpha = 0.5
// console.log(tileLayer)
// Webpage controls

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

function reset() {
  viewer.dataSources.removeAll();
  viewer.entities.removeAll();
  viewer.scene.primitives.removeAll();
  initializeClock()
}

function addToolbarButton(text, onclick, toolbarID) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'cesium-button';
    button.onclick = function() {
        // reset();
        onclick();
    };
    button.textContent = text;
    document.getElementById(toolbarID || 'toolbar2').appendChild(button);
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
    document.getElementById(toolbarID || 'toolbar2').appendChild(menu);

    for (var i = 0, len = options.length; i < len; ++i) {
        var option = document.createElement('option');
        option.textContent = options[i].text;
        option.value = options[i].value;
        option.onselect = options[i].onselect;
        menu.appendChild(option);
    }
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
  console.log(czmlRoute)
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




// Drop down menu, using knockout, which is an older js library to talk to html and react to changes

const imageryLayers = viewer.imageryLayers;

// Knockout uses a viewmodel to track what is changing
const viewModel = {
  layers: [],
  baseLayers: [],
  upLayer: null,
  downLayer: null,
  selectedLayer: null,
  isSelectableLayer: function (layer) {
    return this.baseLayers.indexOf(layer) >= 0;
  },
  raise: function (layer, index) {
    imageryLayers.raise(layer);
    viewModel.upLayer = layer;
    viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
    updateLayerList();
    window.setTimeout(function () {
      viewModel.upLayer = viewModel.downLayer = null;
    }, 10);
  },
  lower: function (layer, index) {
    imageryLayers.lower(layer);
    viewModel.upLayer =
      viewModel.layers[
        Math.min(viewModel.layers.length - 1, index + 1)
      ];
    viewModel.downLayer = layer;
    updateLayerList();
    window.setTimeout(function () {
      viewModel.upLayer = viewModel.downLayer = null;
    }, 10);
  },
  canRaise: function (layerIndex) {
    return layerIndex > 0;
  },
  canLower: function (layerIndex) {
    return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
  },
};
const baseLayers = viewModel.baseLayers;

Cesium.knockout.track(viewModel);

function setupLayers() {
  // Create all the base layers that this example will support.
  // These base layers aren't really special.  It's possible to have multiple of them
  // enabled at once, just like the other layers, but it doesn't make much sense because
  // all of these layers cover the entire globe and are opaque.
  addBaseLayerOption("Bing Maps Aerial", undefined); // the current base layer

  // addBaseLayerOption("Bing Maps Road",Cesium.createWorldImagery({style: Cesium.IonWorldImageryStyle.ROAD}));

  // addBaseLayerOption("ArcGIS World Street Maps",new Cesium.ArcGisMapServerImageryProvider({url:"https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"}));

  addBaseLayerOption("OpenStreetMaps",new Cesium.OpenStreetMapImageryProvider());

  addBaseLayerOption("Stamen Maps", new Cesium.OpenStreetMapImageryProvider({url: "https://stamen-tiles.a.ssl.fastly.net/watercolor/",fileExtension: "jpg"}));

  addBaseLayerOption(
    "Natural Earth II (local)",
    new Cesium.TileMapServiceImageryProvider({
      url: Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
    })
  );
  addBaseLayerOption(
    "USGS Shaded Relief (via WMTS)",
    new Cesium.WebMapTileServiceImageryProvider({
      url:
        "https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS",
      layer: "USGSShadedReliefOnly",
      style: "default",
      format: "image/jpeg",
      tileMatrixSetID: "default028mm",
      maximumLevel: 19,
    })
  );

  // Create the additional layers
  // addAdditionalLayerOption(
  //   "GOES West Infrared",
  //   new Cesium.WebMapServiceImageryProvider({
  //     url:"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/west_ir.cgi?",
  //     layers: "goes_west_ir",
  //     parameters: {
  //       transparent: "true",
  //       format: "image/png",
  //     },
  //   })
  // );

    // //  Looks likes east is conus
    // addAdditionalLayerOption(
    //   "GOES West Full IR",
    //   new Cesium.WebMapServiceImageryProvider({
    //     url:"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_west.cgi?",
    //     layers: "fulldisk_ch14",
    //     parameters: {
    //       transparent: "true",
    //       format: "image/png",
    //     },
    //   })
    // );

    // addAdditionalLayerOption(
    //   "GOES East Full IR",
    //   new Cesium.WebMapServiceImageryProvider({
    //     url:"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes_east.cgi?",
    //     layers: "fulldisk_ch14",
    //     parameters: {
    //       transparent: "true",
    //       format: "image/png",
    //     },
    //   })
    // );

    // // Create the additional layers
    // addAdditionalLayerOption(
    //   "GOES West Vis",
    //   new Cesium.WebMapServiceImageryProvider({
    //     url:"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/west_vis.cgi?",
    //     layers: "goes_west_vis",
    //     parameters: {
    //       transparent: "true",
    //       format: "image/png",
    //     },
    //   })
    // );

      // // Create the additional layers
      // addAdditionalLayerOption(
      //   "GOES East Vis",
      //   new Cesium.WebMapServiceImageryProvider({
      //     url:"https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/east_vis.cgi?",
      //     layers: "goes_east_vis",
      //     parameters: {
      //       transparent: "true",
      //       format: "image/png",
      //     },
      //   })
      // );



  addAdditionalLayerOption(
    "Nexrad Weather Radar",
    new Cesium.WebMapServiceImageryProvider({
      url:
        "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?",
      layers: "nexrad-n0r",
      parameters: {
        transparent: "true",
        format: "image/png",
      },
    })
  );

  addAdditionalLayerOption(
    "Custom Heatmap",
    new Cesium.SingleTileImageryProvider({
      url: "/image",
      // rectangle: Cesium.Rectangle.fromDegrees(-180,-90,180,90),
    }),
    0.5
  );
  addAdditionalLayerOption("Grid",new Cesium.GridImageryProvider(),1.0,false);
}

function addBaseLayerOption(name, imageryProvider) {
  let layer;
  if (typeof imageryProvider === "undefined") {
    layer = imageryLayers.get(0);
    viewModel.selectedLayer = layer;
  } else {
    layer = new Cesium.ImageryLayer(imageryProvider);
  }

  layer.name = name;
  baseLayers.push(layer);
}

function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
  const layer = imageryLayers.addImageryProvider(imageryProvider);
  layer.alpha = Cesium.defaultValue(alpha, 0.5);
  layer.show = Cesium.defaultValue(show, true);
  layer.name = name;
  Cesium.knockout.track(layer, ["alpha", "show", "name"]);
}

function updateLayerList() {
  const numLayers = imageryLayers.length;
  viewModel.layers.splice(0, viewModel.layers.length);
  for (let i = numLayers - 1; i >= 0; --i) {
    viewModel.layers.push(imageryLayers.get(i));
  }
}

setupLayers();
updateLayerList();

//Bind the viewModel to the DOM elements of the UI that call for it.
const toolbar = document.getElementById("toolbar");
Cesium.knockout.applyBindings(viewModel, toolbar);

Cesium.knockout
  .getObservable(viewModel, "selectedLayer")
  .subscribe(function (baseLayer) {
    // Handle changes to the drop-down base layer selector.
    let activeLayerIndex = 0;
    const numLayers = viewModel.layers.length;
    for (let i = 0; i < numLayers; ++i) {
      if (viewModel.isSelectableLayer(viewModel.layers[i])) {
        activeLayerIndex = i;
        break;
      }
    }
    const activeLayer = viewModel.layers[activeLayerIndex];
    const show = activeLayer.show;
    const alpha = activeLayer.alpha;
    imageryLayers.remove(activeLayer, false);
    imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
    baseLayer.show = show;
    baseLayer.alpha = alpha;
    updateLayerList();
  });



