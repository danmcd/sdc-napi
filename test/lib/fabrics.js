/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

/*
 * Test helpers for testing fabrics
 */

'use strict';

var assert = require('assert-plus');
var h = require('../integration/helpers');
var test = require('tape');



// --- Globals



var ENABLED = false;
var CHECKED = false;



/**
 * Check if fabrics are enabled using the /ping endpoint
 */
function checkIfEnabled(callback) {
    if (CHECKED) {
        return setImmediate(callback, null, ENABLED);
    }

    var client = h.createNAPIclient();
    client.ping(function _afterPing(err, res) {
        CHECKED = true;

        if (err) {
            return callback(err);
        }

        if (res.config && res.config.fabrics_enabled) {
            ENABLED = true;
        }

        return callback(null, ENABLED);
    });
}


/**
 * A failing test that is run instead of the regular one if fabrics aren't
 * enabled.  This is because if you call `test.skip()`, no output at all is
 * generated, so the fabrics tests would have no output and exit 0.
 */
function failFabricsTest(t) {
    t.fail('fabrics not enabled - skipping test');
    return t.end();
}


/**
 * A wrapper around tape's test that only runs tests if fabrics are enabled.
 * Note that due to test() not being called on this tick (since
 * checkIfEnabled() runs first), these tests will show up *after* the other
 * high-level tests run.
 */
function testIfFabricsEnabled(testName, testFunc) {
    assert.string(testName, 'testName');
    assert.func(testFunc, 'testFunc');

    test(testName, function (t) {
        checkIfEnabled(function _afterCheck(err, enabled) {
            if (err) {
                t.ifErr(err, 'ping error');
                failFabricsTest(t);
                return;
            }

            if (enabled) {
                testFunc(t);
            } else {
                failFabricsTest(t);
            }
        });
    });
}



module.exports = {
    testIfEnabled: testIfFabricsEnabled
};
