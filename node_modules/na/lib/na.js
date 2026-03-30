/*
 * na
 * http://github.com/forivall/Na.js
 *
 * Copyright (c) 2013 Jordan James Klassen
 * Licensed under the Apache2 license.
 */

'use strict';

var auto = require('async').auto;
var annotate = require('r42/lib/annotate');
var _ = require('lodash');

// TODO: figure out proper way to handle errors

var makeAutoMap;
var self = module.exports = function(tasks, callback) {
    var context = this;
    if (!_.isObject(tasks)) {
        throw new Error('argument to na() must be an object');
    }
    return auto(makeAutoMap.call(context, tasks), function(err, results) {
        var _ref;

        if (err != null) {
            if ((_ref = tasks.$error) != null) { _ref.call(context, err); }
            else { self.globalErrorHandler(err); }
            return;
        }
        // TODO: make this a node-style callback
        // TODO: also offer a promise return value
        // TODO: don't depend on async.auto; write my own implmentation
        if (callback != null) {
            callback(results != null && results.hasOwnProperty('$main') ? results.$main : results);
        }
    });
};
makeAutoMap = self.makeAutoMap = function(tasks) {
    var context = this;
    return _.chain(tasks).transform(function(result, fn, key) {
        if (key === '$error') { return; }

        var autoTask;
        var argNames = annotate(fn);
        var autoFn = function(callback, results) {
            var _ref;
            var callbackUsed = false;
            var args = _.map(argNames, function(argName) {
                if (argName === '$callback') {
                    callbackUsed = true;
                    return function(value) { callback(null, value); };
                }
                // TODO: assert that argName in results !!
                return results[argName];
            });
            try {
                results = fn.apply(context, args);
            } catch (e) {
                if ((_ref = tasks.$error) != null) { _ref.call(context, e); }
                else { self.globalErrorHandler(e); }
            }
            if (callbackUsed) { return; }
            if (results != null && _.isFunction(results.then)) {
                // thenable (assumed Promises/A compliant)
                results.then(function(value) { callback(null, value); }, (_ref = tasks.$error) != null ? _ref.bind(context) :
                    self.globalErrorHandler);
                return;
            }
            // it's just a value!
            callback(null, results);
        };
        if (argNames.length > 0) {
            autoTask = _.without(argNames, '$callback');
            autoTask.push(autoFn);
        } else { autoTask = autoFn; }
        result[key] = autoTask;
    }).value();
};

self.globalErrorHandler = function(e) {
    console.trace();
    throw e;
};
