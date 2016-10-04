var model = {
    filter_list: [{
        filter: 'restaurant'
    }, {
        filter: 'hospital'
    }, {
        filter: 'atm'
    }, {
        filter: 'cafe'
    }, {
        filter: 'all'
    }],
    fav_list: [{
        fav: 'Dominos'
    }, {
        fav: 'Barista'
    }, {
        fav: 'pizza'
    }, {
        fav: 'ice cream'
    }],
    distance:[{
        value: 500,
        distance: '0.5kms'
    }, {
        value: 1000,
        distance: '1 km'
    }, {
        value: 5000,
        distance: '5kms'
    }, {
        value: 10000,
        distance: '10kms'
    }],

};


    var map_timer = setTimeout(function() {
        mapError(true);
    }, 5000); // show up error if map doest load after 5 seconds



    //function to load map
    var map;
	var bounds;
	var markers=[];
	var infoWindows=[];
    var genericSet = 0; // a flag to check if the generic location has been specified

	
    initMap = function() {

        //clear the map error timer
        clearTimeout(map_timer);


        // create a new map object
        map = new google.maps.Map(document.getElementById('map'), {
            center: {
                lat: 37.8136,
                lng: 144.9631
            },
            zoom: 8,
        });

        // set boundaries
        bounds = new google.maps.LatLngBounds();

        //marker icons
        var generic_icon = "images/generic-marker.png";

        //create a general marker for the zoomed view
        generic_marker = new google.maps.Marker({
            icon: generic_icon,
            animation: google.maps.Animation.DROP
        });

        // geo coder to convert names of the places to latLng positions
        geocoder = new google.maps.Geocoder();

        generic_marker.setPosition(map.center);
        generic_marker.setMap(map);

       

        //creating a request to the Google places to set markers based on selected filters		
        show_markers = function(value) {

            if (genericSet) {
                var request = {
                    location: map.center,
                    rankby: 'distance',
                    radius: '1000'
                };

                if (value!='all') {
                    request.types = [value];

                    //create a new Place service object
                    service = new google.maps.places.PlacesService(map);
                    service.nearbySearch(request, callback);


                    function callback(results, status) {
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            for (var i = 0; i < results.length; i++) {

                                createMarker(results[i], value);

                            }
                        } 
                    }
                } else {
                    var types = ['restaurant', 'atm', 'cafe', 'hospital'];
                    service = new google.maps.places.PlacesService(map);
                    for (var i = 0; i < types.length; i++) {

                        request.type = types[i];
                        service.nearbySearch(request, callback);


                        function callback(results, status) {
                            if (status == google.maps.places.PlacesServiceStatus.OK) {
                                for (var i = 0; i < results.length; i++) {

                                    createMarker(results[i], value);

                                }
                            }
                        }
                    }
                }
            } else {
                window.alert("Select the Place To Move first" + status);
            }


        };


        setTimeout(function() {
            show_markers('all');
        }, 2500); //give time for the map to load and generic marker to be set and then load markers




        show_favs = function(value) {
            if (genericSet) {


                var typeRequest = {
                    location: map.center,
                    radius: '500',
                    query: value
                };

                //create a new Place service object
                service = new google.maps.places.PlacesService(map);
                service.textSearch(typeRequest, callback);


                function callback(results, status) {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        var check = 0;
                        var place, name, open_now, rating;
                        for (var i = 0; i < results.length; i++) {
                            if (results[i].geometry.location) {
                                place = results[i].geometry.location;
                            } else {
                                place = map.getCenter();
                            }

                            if (results[i].name) {
                                name = results[i].name;
                            } else {
                                name = typeRequest.query;
                            }

                            if (results[i].opening_hours) {
                                open_now = results[i].opening_hours.open_now;
                            } else {
                                open_now = "no Information";
                            }

                            if (results[i].rating) {
                                rating = results[i].rating;
                            } else {
                                rating = "no Information";
                            }

                            distance_time(place, name, open_now, rating, check);

                        }

                    } else {
                        window.alert("NO results For The Search, Search Another favourite Instead: " + status);
                    }


                }

            } else {
                window.alert("Select the Place To Move first");
            }
        };



        //autocomplete feature
        var input = document.getElementById('find');
        var autocomplete = new google.maps.places.Autocomplete(input);
        autocomplete.bindTo('bounds', map);


        var position; // global , generic markers position

         geocodeAddress= function(geocoder, resultsMap, status) {
            var address;
            if (status) {
                address = document.getElementById('find').value;
            } else {
                address = initialAddress();
            }
            //to call ajax request for wikipedia links 
            var address_split = address.split(',');
            var length = address_split.length;
            var search_string = "";
            var wiki_search = 0;

            var content_string = '<div class="info-display"><div id="pano" class="info-street" > </div><div class="info-wiki"><strong>Wiki Links About your Search </strong>';
            var content_substring = "";
            var wiki_timeout = setTimeout(function() {
                var error_string = "Sorry Could Not Load Please Try Again";
                setGenericWindow(error_string);
            }, 5000); // ajax doesnt have an error method hence we use time out

            for (var i = 0; i < length; i++) {
                var wiki_url = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + address_split[i] + '&profile=fuzzy&limit=3&format=json';

                // ajax call

                $.ajax({
                    url: wiki_url,
                    dataType: 'jsonp',
                    type: 'POST',
                }).done(function(data) {

                    clearTimeout(wiki_timeout);
                    content_substring += '<h3>' + data[0] + '</h3><div class="infowindow-list"><ul>';

                    if (typeof data[3] !== "undefined") {
                        if (data[3].length) {
                            for (var k = 0; k < data[3].length; k++) {
                                content_substring += '<li><a href=' + data[3][k] + ' target="_blank">' + data[1][k] + '</a></li>'; // open link in a new tab
                            }
                        } else {
                            content_substring += '<li>No Related Links Found</li>';
                        }
                    } else {
                        window.alert("Please Enter Valid Search Item");
                    }
                    content_substring += '</ul>';
                    wiki_search += 1;
                    if (wiki_search == length) // create final list of links
                    {

                        content_string += content_substring;
                        content_string += '</div></div>';
                        setGenericWindow(content_string); // function to set the content of generic markers infowindow


                    }


                });
            }



            geocoder.geocode({
                'address': address
            }, function(results, status) {
                if (status === 'OK') {
                    genericSet = 0;

                    resultsMap.setZoom(17);
                    //place the marker on the entered location
                    resultsMap.setCenter(results[0].geometry.location);
                    position = results[0].geometry.location;
                    closeInfoWindows();
                    hide_Allmarkers();
                    updateMarker(position, resultsMap);
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });

            // set the  to the address
            place(address);


        }

		 geocodeAddress(geocoder, map, 0);
        genericSet = 1;
		
        setGenericWindow = function(content_string) {


            infowindow = new google.maps.InfoWindow();
            infowindow.setContent(content_string);
            infowindow.marker = generic_marker;
            infoWindows.push(infowindow);

            generic_marker.addListener('click', function() {

                var streetViewService = new google.maps.StreetViewService();
                var radius = 50;
                // In case the status is OK, which means the pano was found, compute the
                // position of the streetview image, then calculate the heading, then get a
                // panorama from that and set the options
                function getStreetView(data, status) {
                    if (status == google.maps.StreetViewStatus.OK) {
                        var nearStreetViewLocation = data.location.latLng;
                        var heading = google.maps.geometry.spherical.computeHeading(
                            nearStreetViewLocation, generic_marker.position);

                        //infowindow.setContent(content_string);

                        var panoramaOptions = {
                            position: nearStreetViewLocation,
                            pov: {
                                heading: heading,
                                pitch: 30
                            }
                        };
                        var panorama = new google.maps.StreetViewPanorama(
                            document.getElementById('pano'), panoramaOptions);
                    } else {
                        infowindow.setContent('<div>No Street View Found</div>' + content_string);
                    }
                }
                closeInfoWindows();
                streetViewService.getPanoramaByLocation(generic_marker.position, radius, getStreetView);
                infowindow.open(map, generic_marker);
            });

        };



        distance_time = function(marker_position, name, open_now, rating, check) {
            var service = new google.maps.DistanceMatrixService();
            var done = true;

            service.getDistanceMatrix({
                origins: [position],
                destinations: [marker_position],
                travelMode: 'DRIVING',
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            }, function(response, status) {
                if (status !== 'OK') {
                    alert('Error was: ' + status);
                } else {

                    if (response.rows[0].elements[0].status == "OK") //cross check so that there are no zero_results 
                    {
                        var distance = response.rows[0].elements[0].distance.value; //distance from the origin
                        (distance < this.check()) ? done = true: done = false;
                        if (done) {
                            createMarker_fav(marker_position, name, open_now, rating, distance);
                        }
                    }
                }
            });

        };
    };



var myViewModel = function() {
		var self=this;
    show_filter = ko.observable(false);
    show_fav = ko.observable(false);
    place = ko.observable("");
    custom_fav = ko.observable(null);
    fav_selected = ko.observable("None");
    place_set = ko.observable(false);
    show_distance = ko.observable(false);
    mapError = ko.observable(false);
    initialAddress = ko.observable("Melbourne, Victoria, Australia");
	filter_list=ko.observableArray(model.filter_list);
	distance_filter=ko.observableArray(model.distance);
	fav_list=ko.observableArray(model.fav_list);
	check=ko.observable(1000);
	map_loaded=ko.observable(false);


    /* function that makes the list of  favourites when the favourite button is clicked*/
    fav_toggle = function() {
        if (show_fav()) {
            show_fav(false);
            show_distance(false);
        } else {
            show_filter(false);
            show_fav(true);
            show_distance(true);
        }
    };

    /* function that makes the list of  filters when the favourit filter is clicked*/
    filter_toggle = function() {
        if (show_filter()) {
            show_filter(false);
            show_distance(false);
        } else {
            show_filter(true);
            show_fav(false);
            show_distance(false);
        }
    };




    var opener = 0;
    open_menu = function() {
        $('.side-bar').toggleClass('open');
        if (!opener) {
            $('#map').css('top', '0');
            opener = 1;
        } else {
            $('#map').css('top', '50px');
            opener = 0;
        }
    };

    //function to allow a selection (filter or favourite) only once.	
    var prev = "";
    set = function(value) {
        var set = (prev != value) ? true : false;
        prev = value;
        return set;
    };
	
	
    $("input[type='text']").on("click", function() {
        $(this).select();
    });

	
	find=function()
	{
            fav_selected("None");
            custom_fav("");
            check(1000);
            geocodeAddress(geocoder, map, 1);
			
			 // makes the search  items selected appear
        if (place_set()) {
            show_fav(false);

        } else {
            place_set(true);

        }

	}
	
	 self.filterLocations=function(list){
            var value = list.filter;
            fav_selected(value);
            var setter = set(value);
            hide_Allmarkers(); //hide previous markers
			if(genericSet)
			{
            show_markers(value); // show the current markers
			}

        };
		
		self.favLocations=function(fav){
            var value = fav.fav;
            var setter = set(value);
            fav_selected(value);
            hide_Allmarkers(); //hide previous markers
			if(genericSet)
			{
            show_favs(value); // show the current markers
			}
		}
		
		customFavFilter=function() {
            var fav_value = custom_fav();
            var setter = set(fav_value);
            fav_selected(fav_value);
            if (fav_value === null || fav_value.length === 0) {
                window.alert("Enter what to search first");
            } else {
                hide_Allmarkers(); //hide previous markers
				if(genericSet)
				{
                show_favs(fav_value);
				}
            }

        }
		
		createMarker=function (place, value) {
			console.log(place);
            var icon = "images/" + value + ".png"; //set icon based on the filter
            var placeLoc = place.geometry.location;
            var marker = new google.maps.Marker({
                title: value,
                map: map,
                position: place.geometry.location,
                icon: icon
            });
            bounds.extend(marker.position);
            map.fitBounds(bounds);
            markers.push(marker);

            // map zooms out suddenly some times this avoids it
            zoomChangeBoundsListener = google.maps.event.addListenerOnce(map, 'bounds_changed', function(event) {
                if (this.getZoom() < 10) {
                    this.setZoom(12); // if zoom out happens when bounds change zoom in again 
                    this.setCenter(generic_marker.position); // so that even when map redirects when we reset zoom , center doesnt change

                }
            });

            setTimeout(function() {
                google.maps.event.removeListener(zoomChangeBoundsListener);
            }, 10000); // remove the listener after 10 seconds
			
			var placeLoc,open_now,rating;
			     if (place.geometry.location) {
                                placeLoc = place.geometry.location;
                            } else {
                                placeLoc = map.getCenter();
                            }
                            if (place.opening_hours) {
                                open_now = place.opening_hours.open_now;
                            } else {
                                open_now = "no Information";
                            }

                            if (place.opening_hours) {
                                rating = place.rating;
                            } else {
                                rating = "no Information";
                            }

            var infowindow = new google.maps.InfoWindow({
                content: '<div><p><strong>Type: </strong>' + place.types + 
						'<br><strong>Name: </strong>' + place.name +
						'<br><strong>Open Now: </strong>'+open_now+
						'<br><strong>Rating: </strong>'+rating+'</p></div>'
            });
            infoWindows.push(infowindow);

            marker.addListener('click', function() {
                closeInfoWindows();
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 2000); // bounce for 2 seconds
                infowindow.open(map, marker);
            });
        }
		
		

		createMarker_fav=function (place, name, open_now, rating, distance) {

            var contentString = '<div id="content">' +
                '<div id="siteNotice">' +
                '</div>' +
                '<div id="bodyContent">' +
                '<p><b>' + name + '</b><br>' +
                '<b>Open Now: </b>' + open_now + '<br>' +
                '<b>Rating: </b>' + rating + '<br>' +
                '<b>Distance:</b>' + distance + 'meters</p>' +
                '</div>' +
                '</div>';

            closeInfoWindows();

            var infowindow = new google.maps.InfoWindow({
                content: contentString
            });

            var marker = new google.maps.Marker({
                map: map,
                position: place
            });
            bounds.extend(marker.position);
            markers.push(marker);
            map.fitBounds(bounds);
            infoWindows.push(infowindow);
			
            // map zooms out suddenly some times this avoids it
            zoomChangeBoundsListener = google.maps.event.addListenerOnce(map, 'bounds_changed', function(event) {
                if (this.getZoom() < 10) {
                    this.setZoom(12); // if zoom out happens when bounds change zoom in again 
                    this.setCenter(generic_marker.position); // so that even when map redirects when we reset zoom , center doesnt change

                }
            });

            setTimeout(function() {
                google.maps.event.removeListener(zoomChangeBoundsListener);
            }, 10000); // remove the listener after 10 seconds

            marker.addListener('click', function() {
                closeInfoWindows(); //close all other info windows
                infowindow.open(map, marker);
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 2000); // bounce for 2 seconds
            });

        }
		
		//update position of generic marker
		 updateMarker = function(position, map) {

            generic_marker.setPosition(position);
            generic_marker.setMap(map);
            bounds.extend(generic_marker.position);
            genericSet = 1;
			map_loaded(true);
        };

		//close info windows
        closeInfoWindows = function() {

            for (var i = 0; i < infoWindows.length; i++) {
                infoWindows[i].close();
            }
        };

		//function to hide all the markers
         hide_Allmarkers=function() {

            for (var i = 0; i < markers.length; i++) {
                markers[i].setMap(null);
            }
        }
};



ko.applyBindings(new myViewModel());