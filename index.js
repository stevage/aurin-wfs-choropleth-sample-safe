const WebFeatureService = require('webfeatureservice');
const MapboxChoropleth = require('mapbox-choropleth');
mapboxgl.accessToken = 'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJGcW03aExzIn0.QUkUmTGIO3gGt83HiRIjQw';

// proxying server that inserts our credentials so they're not exposed to the web.
const urlBase = 'https://someserver.glitch.me';

const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    center: [132, -25], // starting position [lng, lat]
    zoom: 4 // starting zoom
});
map.onLoaded = cb => map.loaded() ? cb() : map.on('load', cb);

function loadPumps() {
    function addPoints(points, id) {
        map.onLoaded(() => {
            map.addLayer({
                id: id || 'points-' + String(Math.random()).slice(3), // Mapbox didn't like the . 
                type: 'circle',
                source: {
                    type: 'geojson',
                    data: points
                }
            });
        });
    }
    service.getFeature({
        typeName: 'aurin:datasource-MW-UoM_AURIN_DB_mw_dr_pumping_station_2018',
    }).then(p => addPoints(p, 'pumps')).catch(console.error);
}

function loadChoropleth() {
    const geomTypeName = 'aurin:SA2_2011_AUST';
    const tableIdField = 'sa2_main11';
    const tableNumericField = 'age_pension';
    service.getFeature({
        typeName: 'aurin:datasource-au_govt_dss-UoM_AURIN_dss_payments_sa2_q4_2017',
        outputFormat: 'CSV',
        propertyName: [tableIdField, tableNumericField]
    }).then(tableRows => {
        const choropleth = new MapboxChoropleth({
            tableRows, tableNumericField, tableIdField,
            geometryIdField: 'SA2_MAIN11',
            geometryTiles: [`${urlBase}/gwc/service/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${geomTypeName}&STYLE=&TILEMATRIX=EPSG:900913:{z}&TILEMATRIXSET=EPSG:900913&FORMAT=application/x-protobuf;type=mapbox-vector&TILECOL={x}&TILEROW={y}`],
            sourceLayer: geomTypeName.replace('aurin:', ''),
            colorScheme: 'YlOrRd',
            paint: { 'fill-opacity': 0.5 }
        });
        map.onLoaded(() => choropleth.addTo(map) );
    });
}

const service = new WebFeatureService({ url: urlBase + '/wfs' });
loadPumps();
loadChoropleth();