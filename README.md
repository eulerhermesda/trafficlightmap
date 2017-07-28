# Demo of the TrafficLight API overlaid on a map

This is a very quick demo of how the EHDA TrafficLight API can be used, overlaid on a map.
Companies are queried per area (zipcode exactly) then identified on the map by their TrafficLight color (green, yellow, red, black). Unknowns are not displayed.

![demonstration video](https://github.com/eulerhermesda/trafficlightmap/blob/master/riskmap.mp4?raw=true)

**IMPORTANT: The data used in this sample from the demo API linked in the source is fake data and does not represent the real value and credit risk of those companies.**

* Click on a company marker to display its name and address.
* Zoom in/out and move around to load other companies from the Euler Hermes data base.
* Below the map, have a look at some statistics from the loaded companies.


If you want to display more companies change the settings in the load_companies function :
```
  function load_companies(code) {
	  for (k=0; k<5; k++) {        
		  function pagination(k) {
        urlAddress = urlGetAddress+code+"/"+k+"?pageSize=5";    
			  return loadTable(urlAddress) 
		  };
		  pagination(k)
	  }
    }
```

The companies are loaded with a pagination mode 
* k is the page number, so if you want 10 pages just write : `for (k=0; k<10; k++) {`
* pageSize is the number of company per page, here it's 5 companies per page

## Dependencies
* OpenStreetMaps
* Google Maps geocoding API
* EHDA TrafficLight API

## TODO list
* Better performance
* Ability to limit companies by activity sector / ...
* Integrate another geocoding API to be able to make more calls
* Use batch trafficlight for more exhaustive display
* Display links between companies
* Work for countries outside France
