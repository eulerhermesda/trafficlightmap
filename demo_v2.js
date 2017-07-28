// Secret API keys - insert your own here
// keyGetPostal     : Google Maps Geocode API key
// keyGetCoordinate : Google Maps Geocode API key
// keyTraffic       : TrafficLight API key to get trafficlight of companies
// keyGetAddress    : TrafficLight API key to get all companies in a specific area
keyGetPostal = '&key=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
keyGetCoordinate = keyGetPostal;
keyGetAddress = {headers: {'apikey': 'yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'}};
keyTraffic = {headers: {'apikey': 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'}};

urlGetPostal = 'https://maps.googleapis.com/maps/api/geocode/json';
urlGetCoordinate = 'https://maps.googleapis.com/maps/api/geocode/json';
urlGetAddress = 'https://api-demo.single-invoice.co/v2/transactor/getaddresses/';
urlGetTraffic = 'https://api-demo.single-invoice.co/v2/trafficlight/';

// Generate map layer
map = new ol.Map({
	layers:[
		new ol.layer.Tile({
			source: new ol.source.OSM()
		})
	],
	loadTilesWhileAnimating: true,
	loadTilesWhilesInteracting: true,
	renderer: 'canvas',
	target: 'map',
	view: new ol.View({
		center: [parseFloat(ol.proj.transform([2.2495486,48.8887815],'EPSG:4326', 'EPSG:3857')[0]),parseFloat(ol.proj.transform([2.2495486,48.8887815],'EPSG:4326', 'EPSG:3857')[1])],
		zoom: 15,
		projection: 'EPSG:3857'
	})
})

map.on('moveend', codePostal);
//map.on('moveend', stats);

//Stats
bad_address=0;
bad_geocoding=0;

// First function called when moving to a new area (zip code)
function codePostal() {

    // Reset counts for each zip code
    total_api=0;
    green=0;
    yellow=0;
    red=0;
    black=0;
    white=0;

    // read coordinates of center of new area : latitude and longitude
	centre = ol.proj.transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    // get zip code for this latitude and longitude from google geocoding API
	urlPostal = urlGetPostal+"?latlng="+centre[1]+","+centre[0]+keyGetPostal;
	fetch(urlPostal)
	.then(function(response) {
		return response.json();
	})
	.then(function(codePostal) {
        console.log(codePostal)
		code = codePostal["results"][0]["address_components"][6]["long_name"];
		if (code == document.getElementById('postal').innerHTML) {
			console.log("code postal inchangé");
			return;
		}
		document.getElementById('postal').innerHTML = code;
		console.log("nouveau code postal");
        // remove all layers previously added
		map.getLayers()['a'].splice(1,map.getLayers()['a'].length - 1);
		return get_companies(code);
	})

}

// Get all companies for a specific zip code from the TrafficLight API
// and show them on the map
function get_companies(code) {
	for (k=0; k<10; k++) {
		function pagination(k) {
			urlAddress = urlGetAddress+code+"/"+k+"?pageSize=10";
			return load_companies(urlAddress) 
		};
		pagination(k)
	}
}

function load_companies(urlAddress) {
	console.log("chargement de la page ",k);
    // get a table with all companies from a zipcode
	fetch(urlAddress,keyGetAddress)
	.then(function(response) {
		return response.json()
	})
	.then(function(entreprises) {
		var featureArray = [];
		for (i=0;i<entreprises.length;i++) {
			var featureFirm = new ol.Feature({
				streetNumber : entreprises[i]["Address"]["StreetNumber"],
				street : entreprises[i]["Address"]["StreetName"],
				city : entreprises[i]["Address"]["City"],
				name: entreprises[i]["Name"],
			});
			total_api+=1;
			featureArray.push(featureFirm);
 		}
		map.addLayer(new ol.layer.Vector({
			source: new ol.source.Vector({
				features: featureArray
			})
		}));
		return([entreprises,featureArray])
	})

    // fill trafficlight info for all companies
	.then(function(ehdata) {
		for (var j=0; j<ehdata[0].length; j++) {
			function style(firm,feature) {
				var urlTraffic = urlGetTraffic+firm["Id"];
				fetch(urlTraffic,keyTraffic)
				.then(function(response) {
					return response.json();
				})
				.then(function(grade) {
					firm["Grade"]=grade["Color"];
					ehdata[0][j] = firm;
					if (grade["Color"].toLowerCase()=='white') {
						white+=1;
						if (Object.keys(ehdata[0][j]).length==5) {feature.unset('geometry');console.log("unset geometry - ",Object.keys(ehdata[0][j]).length)}
						return
					}
                    else if (grade["Color"].toLowerCase()=='yellow') { yellow+=1 }
                    else if (grade["Color"].toLowerCase()=='green' ) { green +=1 }
                    else if (grade["Color"].toLowerCase()=='red'   ) { red   +=1 }
                    else if (grade["Color"].toLowerCase()=='black' ) { black +=1 }
                    else { consoloe.log('unknown color'); console.log(grade["color"]); }
					var color = new ol.style.Style({
						image: new ol.style.Circle({
							radius: 7,
							snapToPixel: false,
							fill: new ol.style.Fill({color: grade["Color"].toLowerCase()})
						}),
					});
					feature.setStyle(color);
					feature.set("Grade",grade["Color"].toLowerCase());
                    stats();
				})
			};
			style(ehdata[0][j],ehdata[1][j])
		};
	return ([ehdata[0],ehdata[1]]) 
	})

    // position all companies on the map
	.then(function(ehdata) {
		for (var j=0; j<ehdata[0].length; j++) {
			function position(firm, feature) {
				if (Object.keys(ehdata[0][j]).length==4 && ehdata[0][j]["Grade"].toLowerCase()=='white') {console.log("not set",Object.keys(ehdata[0][j]).length);return}
				if (firm['Address']['StreetName']=='') {return}
				if (firm['Address']['StreetNumber']==null) {firm['Address']['StreetNumber']=''}
				if (firm['Address']['StreetNumber']=='') {var address = firm['Address']['StreetName']+',+'+firm['Address']['City']+',+'+firm['Address']['CountryCode']}
				else {var address = firm['Address']['StreetNumber']+"+"+firm['Address']['StreetName']+',+'+firm['Address']['City']+',+'+firm['Address']['CountryCode']}
				address = address.replace(/   /g," ");
				address = address.replace(/  /g," ");
				address = address.replace(/ /g,"+");
				address = address.toLowerCase();
				var urlCoordinate = urlGetCoordinate+"?address="+address+keyGetCoordinate;
				fetch(urlCoordinate)
				.then(function(response) {
					return response.json();
				})
				.then(function(geocoding) {
					if (geocoding['results']=='ZERO_RESULTS' || geocoding['results'].length == 0) {console.log("returning..."); return;}
					feature.setGeometry(new ol.geom.Point(ol.proj.fromLonLat([parseFloat(geocoding["results"][0]["geometry"]["location"]["lng"]),parseFloat(geocoding["results"][0]["geometry"]["location"]["lat"])])));
					firm["Coordinate"] = geocoding["results"][0]["geometry"]["location"];
					ehdata[0][j] = firm;
				})
			};
			position(ehdata[0][j],ehdata[1][j])
		}
	})
};


// -----------------------------------------------------------------------------
// Program popup behaviour when clicking on a company sticker
// -----------------------------------------------------------------------------

var element = document.getElementById('popup');

popup = new ol.Overlay({
	element: document.getElementById('popup'),
	positioning: 'bottom-center',
	stopEvent: false,
	offset: [0,0]
});

map.addOverlay(popup);

//display popup on click
map.on('click', function(evt) {
	$(element).popover('destroy');
	feature = map.forEachFeatureAtPixel(evt.pixel,
		function(feature) {
			return feature;
	});
	if (feature) {
		coordinates = feature.getGeometry().getCoordinates();
		popup.setPosition(coordinates);
		if ((feature.get("Grade")== 'black') || (feature.get("Grade")== 'red')) {
			$(element).popover({
				'placement': 'top',
				'html': true,
				'content': "<p style='font-weight:bold;background-color:"+feature.get('Grade')+";color:white;'>"+feature.get('name')+"</p><p>"+feature.get('streetNumber')+" "+feature.get('street')+", "+feature.get('city')+"</p>",
			})
		}
		else {
			$(element).popover({
				'placement': 'top',
				'html': true,
				'content': "<p style='font-weight:bold;background-color:"+feature.get('Grade')+";'>"+feature.get('name')+"</p><p>"+feature.get('streetNumber')+" "+feature.get('street')+", "+feature.get('city')+"</p>",
			})
		}
		$(element).popover('show');
	}
	else {
		$(element).popover('destroy');
	}
});

//destroy popup when dragging
map.on('pointermove', function(e) {
	if (e.dragging) {
		$(element).popover('destroy');
		return;
	}
})

function stats() {
	var pourcentage_white  = Math.round(white  / total_api * 100, 2);
	var pourcentage_green  = Math.round(green  / total_api * 100, 2);
	var pourcentage_yellow = Math.round(yellow / total_api * 100, 2);
	var pourcentage_red    = Math.round(red    / total_api * 100, 2);
	var pourcentage_black  = Math.round(black  / total_api * 100, 2);
	var pourcentage_other  = 100 - pourcentage_white - pourcentage_yellow - pourcentage_green - pourcentage_red - pourcentage_black;
	document.getElementById('stats').innerHTML = "# of companies in sample : " + total_api + "<br>" +
                "White grade: "+pourcentage_white+"%<br>" +
                "Green  grade: "+pourcentage_green +"%<br>" +
                "Yellow grade: "+pourcentage_yellow+"%<br>" +
                "Red    grade: "+pourcentage_red   +"%<br>" +
                "Black  grade: "+pourcentage_black +"%<br>" +
                "Other grades: "+pourcentage_other+"%";
}
