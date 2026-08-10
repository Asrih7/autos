(function (window) {
  function giveMeAddressComponent(place, componentType) {
    if (!place || !Array.isArray(place.address_components)) {
      return '';
    }

    for (var i = 0; i < place.address_components.length; i++) {
      var component = place.address_components[i];
      if (Array.isArray(component.types) && component.types.indexOf(componentType) > -1) {
        return component.long_name || '';
      }
    }

    return '';
  }

  function parseAddressFromGooglePlace(place) {
    if (!place || !Array.isArray(place.address_components)) {
      return null;
    }

    var route = giveMeAddressComponent(place, 'route');
    var streetNumber = giveMeAddressComponent(place, 'street_number');
    var postalCode = giveMeAddressComponent(place, 'postal_code');
    var locality = giveMeAddressComponent(place, 'locality') || giveMeAddressComponent(place, 'postal_town') || giveMeAddressComponent(place, 'administrative_area_level_2') || '';
    var province = giveMeAddressComponent(place, 'administrative_area_level_1') || locality;

    var routeTokens = route ? route.split(' ').filter(function (token) { return !!token; }) : [];
    var tipoVia = routeTokens.length ? routeTokens[0] : '';
    var nombreVia = routeTokens.length > 1 ? routeTokens.slice(1).join(' ') : '';

    return {
      tipoVia: tipoVia,
      nombreVia: nombreVia,
      numero: streetNumber,
      codigoPostal: postalCode,
      provincia: province,
      localidad: locality,
    };
  }

  function setupGoogleAutocomplete(inputElement, onAddressSelected) {
    if (!window.google || !window.google.maps || !window.google.maps.places || !window.google.maps.places.Autocomplete) {
      throw new Error('Google Places API is not available');
    }

    var autocomplete = new window.google.maps.places.Autocomplete(inputElement, {
      types: ['address'],
      componentRestrictions: { country: 'ES' },
    });

    autocomplete.setFields(['address_component']);
    autocomplete.addListener('place_changed', function () {
      var place = autocomplete.getPlace();
      var parsed = parseAddressFromGooglePlace(place);
      if (parsed) {
        onAddressSelected(parsed);
      }
    });
  }

  window.giveMeAddressComponent = giveMeAddressComponent;
  window.loadDomicilioGoogle = function (inputElement, onAddressSelected) {
    setupGoogleAutocomplete(inputElement, onAddressSelected);
  };
})(window);
