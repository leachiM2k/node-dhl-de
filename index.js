'use strict';

var soap = require('soap');
var url = 'https://cig.dhl.de/cig-wsdls/com/dpdhl/wsdl/standortsuche-api/1.0/standortsuche-api-1.0.wsdl';
var options = {
    ignoredNamespaces: {
        namespaces: [],
        override:   true
    },
    endpoint:          'https://cig.dhl.de/services/sandbox/soap'
};
var username = process.env.DHL_USER;
var password = process.env.DHL_PASSWORD;

if (!username || !password) {
    throw new Error('DHL_USER and/or DHL_PASSWORD not found in environment');
}

soap.createClient(url, options, function (err, client) {
    client.setSecurity(new soap.BasicAuthSecurity(username, password));
    var args = {
        key:     '',
        address: {
            zip: process.argv[0] || 40210
        }
    };

    client.getPackstationsPaketboxesByAddress(args, function (err, result) {
        if (err) {
            throw new Error(err);
            return;
        }

        console.log(JSON.stringify(transformToGeoJson(result)));
    });

});

function transformToGeoJson(data) {
    var geoJSON = {
        type:     "FeatureCollection",
        features: []
    };

    data.packstation_paketbox.forEach(function (packstation) {
        geoJSON.features.push({
            "type":       "Feature",
            "properties": {
                name: packstation.address.street + ' ' + packstation.address.streetNo
            },
            "geometry":   {
                "type":        "Point",
                "coordinates": [
                    Number(packstation.location.longitude),
                    Number(packstation.location.latitude)
                ]
            }
        });
    });

    return geoJSON;
}
