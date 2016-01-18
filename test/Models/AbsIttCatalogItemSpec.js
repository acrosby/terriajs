'use strict';

/*global require, fail*/
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var Terria = require('../../lib/Models/Terria');
var AbsIttCatalogItem = require('../../lib/Models/AbsIttCatalogItem');

var sinon = require('sinon');
var URI = require('urijs');

describe('AbsIttCatalogItem', function() {
    var terria;
    var item;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        item = new AbsIttCatalogItem(terria);
    });

    // Is this an important feature?
    // it('defaults to having no dataUrl', function() {
    //     item.url = 'http://foo.bar';
    //     expect(item.dataUrl).toBeUndefined();
    //     expect(item.dataUrlType).toBeUndefined();
    // });

    it('uses explicitly-provided dataUrl and dataUrlType', function() {
        item.dataUrl = 'http://foo.com/data';
        item.dataUrlType = 'wfs-complete';
        item.url = 'http://foo.com/somethingElse';
        expect(item.dataUrl).toBe('http://foo.com/data');
        expect(item.dataUrlType).toBe('wfs-complete');
    });

    it('can update from json', function() {
        item.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://foo.bar',
            dataCustodian: 'Data Custodian',
        });
        expect(item.name).toBe('Name');
        expect(item.description).toBe('Description');
        expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(item.type).toBe('abs-itt');
        expect(item.url.indexOf('http://foo.bar')).toBe(0);
        expect(item.dataCustodian).toBe('Data Custodian');
    });

    describe('loading', function() {
        var fakeServer;

        beforeEach(function() {
            fakeServer = sinon.fakeServer.create();
            fakeServer.autoRespond = true;

            fakeServer.respond(function(request) {
                fail('Unhandled request to URL: ' + request.url);
            });

            fakeServer.respondWith(
                'GET',
                'data/abs_names.json',
                JSON.stringify({
                    AGE: "Age",
                    MEASURE : {
                        "Persons" : "Sex",
                        "85 years and over" : "Age",
                        "*" : "Measure"
                    }
                })
            );

            fakeServer.respondWith(
                'GET',
                'http://abs.example.com/?method=GetDatasetConcepts&datasetid=foo&format=json',
                JSON.stringify({
                    concepts: [
                        "FREQUENCY",
                        "STATE",
                        "AGE",
                        "REGIONTYPE",
                        "REGION"
                    ]
                })
            );

            fakeServer.respondWith(
                'GET',
                'http://abs.example.com/?method=GetCodeListValue&datasetid=foo&concept=AGE&format=json',
                JSON.stringify({
                    codes: [
                        {
                            code: "A02",
                            description: "0-2 years",
                            parentCode: "",
                            parentDescription: ""
                        },
                        {
                            code: "0",
                            description: "0",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "1",
                            description: "1",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "2",
                            description: "2",
                            parentCode: "A02",
                            parentDescription: "0-2 years"
                        },
                        {
                            code: "OTHER",
                            description: "Older than 2",
                            parentCode: "",
                            parentDescription: ""
                        }
                    ]
                })
            );
        });

        afterEach(function() {
            fakeServer.restore();
        });

        it('works', function(done) {

            item.updateFromJson({
                name: 'Name',
                datasetId: 'foo',
                url: 'http://abs.example.com'
            });
            item.load().then(function() {
                console.log('boo');  // TODO: complete
            }).otherwise(fail).then(done);
        });

    });

});
