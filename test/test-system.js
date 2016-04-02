'use strict';

var apiPort = process.env.API_PORT||3002;
var apiURL = 'http://localhost:' + apiPort + '/system';
var apiURL2 = 'http://localhost:' + apiPort + '/rooms';
var apiURL3 = 'http://localhost:' + apiPort + '/devices';
var apiURL4 = 'http://localhost:' + apiPort + '/devices/10/action/setStatus/0';
var apiURL5 = 'http://localhost:' + apiPort + '/devices/447/action/setLevel/100';
var apiURL6 = 'http://localhost:' + apiPort + '/devices/190/action/setSetPoint/1';

var superagent = require('superagent');
var chai = require('chai');
var expect = chai.expect;
var should = require('should');

describe('System', function () {
  it('Testing call to ' + apiURL, function (done) {
    superagent.get(apiURL)
      .end(function (err, res) {
        (err === null).should.equal(true);
        res.statusCode.should.equal(200);
        done();
      });
  });
});
describe('Rooms', function () {
  it('Testing call to ' + apiURL2, function (done) {
    superagent.get(apiURL2)
      .end(function (err, res) {
        (err === null).should.equal(true);
        res.statusCode.should.equal(200);
        done();
      });
  });
});
describe('Devices', function () {
  it('Testing call to ' + apiURL3, function (done) {
    superagent.get(apiURL3)
      .end(function (err, res) {
        (err === null).should.equal(true);
        res.statusCode.should.equal(200);
        done();
      });
  });
});
