var model = {
    filter_list: [{
        filter: 'restaurant'
    }, {
        filter: 'hospital'
    }, {
        filter: 'atm'
    }, {
        filter: 'cafe'
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
    distance: [{
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
    }]

};


var map_timer = setTimeout(function() {
    mapError(true);
}, 5000); // show up error if map doest load after 5 seconds



//function to load map
var map;
var bounds;
var markers = [];
var infoWindows = [];
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



            if (value != 'all') {
                request.types = [value];
                hide_Allmarkers();
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
                hide_Allmarkers();
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

    //function to find nearby using foursquare Api
    findNearBy = function() {

        var nearby_timeout = setTimeout(function() {
            alert("sorry there is an error Try again");
        }, 5000); // ajax doesnt have an error method hence we use time out
        hide_Allmarkers();
        var lat = generic_marker.position.lat();
        var lng = generic_marker.position.lng();
        var nearByUrls = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng + '&client_id=5K0YFYYHA5QLRMPNEEXRKJQTRNHKXJJXKDYS1WB0ZJWNQBHD&client_secret=1I4K3KDJ24F3MNWC2HEHNDMMC0PAC3JMIMZDNCQAJMOSBK3P&v=20140806';
        $.ajax({
            url: nearByUrls,
            type: 'POST',
        }).done(function(data) {
            clearTimeout(nearby_timeout);
            for (var i = 0; i < data.response.venues.length; i++) {
                nearBymarkers(data.response.venues[i]);
            }
        });
    };


    //set markers on the favourite position
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


    //set the generic marker and content string for the infowindow for the generic string
    setGenericWindow = function(content_string) {


        infowindow = new google.maps.InfoWindow();
        infowindow.setContent(content_string);
        infowindow.marker = generic_marker;
        infoWindows.push(infowindow);

        generic_marker.addListener('click', function() {

            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;
            generic_marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                generic_marker.setAnimation(null);
            }, 2000);
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

    //autocomplete feature
    var input = document.getElementById('find');
    var autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);


    var position; // global , generic markers position

    geocodeAddress = function(geocoder, resultsMap, status) {
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
    };

    geocodeAddress(geocoder, map, 0);
    genericSet = 1;


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
    var self = this;
    this.show_filter = ko.observable(false);
    this.show_fav = ko.observable(false);
    this.custom_fav = ko.observable(null);
    this.fav_selected = ko.observable("None");
    this.place_set = ko.observable(false);
    this.filter_list = ko.observableArray(model.filter_list);
    this.distance_filter = ko.observableArray(model.distance);
    this.fav_list = ko.observableArray(model.fav_list);
    this.map_loaded = ko.observable(false);
    this.PlaceArray = ko.observableArray();
    this.showFourSquare = ko.observable(false);
    this.initialFilter = ko.observable(true);
    this.initialCategory = ko.observable("");
    this.display = [];
    this.showInitialList = ko.observable(true);
    place = ko.observable("");
    check = ko.observable(1000);
    mapError = ko.observable(false);
    initialAddress = ko.observable("Melbourne, Victoria, Australia");



    this.locationArray = ko.observableArray();
    /* function that makes the list of  favourites when the favourite button is clicked*/
    fav_toggle = function() {
        if (self.show_fav()) {
            self.show_fav(false);
            self.showFourSquare(false);
            self.showInitialList(false);
        } else {
            self.show_filter(false);
            self.show_fav(true);
            self.showFourSquare(false);
            self.showInitialList(false);
        }
    };

    /* function that makes the list of  filters when the favourite filter is clicked*/
    filter_toggle = function() {
        if (self.show_filter()) {
            self.show_filter(false);
            self.showFourSquare(false);
            self.showInitialList(false);
        } else {
            self.show_filter(true);
            self.show_fav(false);
            self.showFourSquare(false);
            self.showInitialList(false);
        }
    };

    /* function that makes the list of  fourSquare NearBy when the favourite filter is clicked*/
    setFoursQuare = function() {
        if (self.showFourSquare()) {
            self.showFourSquare(false);
            self.showInitialList(false);
            hide_Allmarkers();
        } else {
            self.show_filter(false);
            self.show_fav(false);
            self.showFourSquare(true);
            self.showInitialList(false);
            self.PlaceArray([]);
            nearby = findNearBy();
        }
    };



    //open menu when hamburger icon is clicked
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

    //this is used to select the input text at the input tag so that backspacing becomes easier
    $("input[type='text']").on("click", function() {
        $(this).select();
    });

    //function to find the location of the place entered 
    find = function(obj) {
        self.fav_selected("None");
        self.custom_fav("");
        check(1000);
        geocodeAddress(geocoder, map, 1);
        if (self.place_set()) {
            self.show_fav(false);

        } else {
            self.place_set(true);

        }

    };

    //function to filter favourite locations from the list
    self.filterLocations = function(list) {
        var value = list.filter;
        self.fav_selected(value);
        var setter = set(value);
        hide_Allmarkers(); //hide previous markers
        if (genericSet) {
            show_markers(value); // show the current markers
        }

    };

    //function to set markers to favourite locations
    self.favLocations = function(fav) {
        var value = fav.fav;
        var setter = set(value);
        self.fav_selected(value);
        hide_Allmarkers(); //hide previous markers
        if (genericSet) {
            show_favs(value); // show the current markers
        }
    };

    //custom favourite filter when favourite is given through the input box
    customFavFilter = function() {
        var fav_value = self.custom_fav();
        var setter = set(fav_value);
        self.fav_selected(fav_value);
        if (fav_value === null || fav_value.length === 0) {
            window.alert("Enter what to search first");
        } else {
            hide_Allmarkers(); //hide previous markers
            if (genericSet) {
                show_favs(fav_value);
            }
        }

    };


    //create normal markers
    createMarker = function(place, value) {
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
        placeLoc.marker = marker;
        placeLoc.type = place.types;
        self.locationArray.push({
            place: placeLoc,
            name: place.name
        });
        // map zooms out suddenly some times this avoids it
        zoomChangeBoundsListener = google.maps.event.addListenerOnce(map, 'bounds_changed', function(event) {
            if (this.getZoom() < 10) {
                this.setZoom(13); // if zoom out happens when bounds change zoom in again 
                this.setCenter(generic_marker.position); // so that even when map redirects when we reset zoom , center doesnt change

            }
        });

        setTimeout(function() {
            google.maps.event.removeListener(zoomChangeBoundsListener);
        }, 10000); // remove the listener after 10 seconds

        var placeLoc, open_now, rating;
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
                '<br><strong>Open Now: </strong>' + open_now +
                '<br><strong>Rating: </strong>' + rating + '</p></div>'
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
    };


    //create markers for favourites
    createMarker_fav = function(place, name, open_now, rating, distance) {

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
                this.setZoom(13); // if zoom out happens when bounds change zoom in again 
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

    };



    //update position of generic marker and perform basic setups
    updateMarker = function(position, map) {

        generic_marker.setPosition(position);
        generic_marker.setMap(map);
        bounds.extend(generic_marker.position);
        genericSet = 1;
        self.map_loaded(true);
        self.showFourSquare(false);
        self.display = [];
        self.PlaceArray([]);
        self.locationArray([]);
        show_markers('all');
        self.display.push(self.locationArray());
        self.showInitialList(true);
    };

    //close info windowssetinitiallist
    closeInfoWindows = function() {

        for (var i = 0; i < infoWindows.length; i++) {
            infoWindows[i].close();
        }
    };

    //function to hide all the markers
    hide_Allmarkers = function() {

        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
    };

    //function that makes info window associated with nearby foursquare list pop up
    infoPop = function(location) {
        google.maps.event.trigger(location.position.marker, 'click');

    };

    initialInfoPop = function(location) {
        google.maps.event.trigger(location.place.marker, 'click');

    };


    //set markers for position returned by foursquare Api
    nearBymarkers = function(data) {
        var position = {
            lat: data.location.lat,
            lng: data.location.lng
        };


        if (position == generic_marker.position) {
            //do nothing
        } else {
            var marker = new google.maps.Marker({
                animation: google.maps.Animation.DROP,
                position: position,
                map: map
            });
            position.marker = marker;
            bounds.extend(marker.position);
            map.fitBounds(bounds);
            markers.push(marker);
            zoomChangeBoundsListener = google.maps.event.addListenerOnce(map, 'bounds_changed', function(event) {
                if (this.getZoom() < 10) {
                    this.setZoom(13); // if zoom out happens when bounds change zoom in again 
                    this.setCenter(generic_marker.position); // so that even when map redirects when we reset zoom , center doesnt change

                }
            });

            if (typeof data.categories[0] !== "undefined") {

                if (data.url) {
                    var url = data.url;
                } else {
                    var url = "No Information";
                }
                if (data.contact.phone) {
                    var phone = data.contact.phone;
                } else {
                    var phone = "No Information";
                }
                var name = data.categories[0].name;

                var content_string = '<div><strong>Name:</strong>:' + data.name + '<br>' +
                    '<strong>type:</strong>:' + name + '<br>' +
                    '<strong>Url:</strong>:' + url + '<br>' +
                    '<strong>Phone:</strong>:' + phone + '</div>';

                var infowindower = new google.maps.InfoWindow({
                    content: content_string
                });
                marker.addListener('click', function() {
                    closeInfoWindows();
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    setTimeout(function() {
                        marker.setAnimation(null);
                    }, 2000);
                    infowindower.open(map, marker);
                });
                infoWindows.push(infowindower);
                self.PlaceArray.push({
                    name: data.name,
                    position: position
                });
            }
        }

    };


    //function to filter out markers and list of initial location based on user inputs
    initialCatClick = function() {
        self.locationArray([]);
        if (self.initialCategory() == 'all') {
            for (var i = 0; i < self.display[0].length; i++) {
                self.locationArray.push(self.display[0][i]);
            }
        } else {
            for (var i = 0; i < self.display[0].length; i++) {
                self.display[0][i].place.type.forEach(function(placeType) {
                    if (placeType == self.initialCategory()) {
                        self.locationArray.push(self.display[0][i]);
                    }
                });
            }
        }
        closeInfoWindows();
        hide_Allmarkers();
        self.locationArray().forEach(
            function(location) {
                location.place.marker.setMap(map);
            });
    };

};



ko.applyBindings(new myViewModel());