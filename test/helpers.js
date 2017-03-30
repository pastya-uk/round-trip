/* */ 
(function(process) {
  'use strict';
  beforeEach(function() {
    jasmine.addMatchers({
      toEquals: function(util, customEqualityTesters) {
        return {compare: function(actual, expected) {
            var result = {};
            result.pass = angular.equals(actual, expected);
            result.message = 'Expected "' + angular.mock.dump(actual) + '" to equal "' + angular.mock.dump(expected) + '".';
            return result;
          }};
      },
      toHaveClass: function(util, customEqualityTesters) {
        return {compare: function(actual, expected) {
            var result = {};
            result.pass = actual.hasClass(expected);
            result.message = 'Expected "' + angular.mock.dump(actual) + '" to have class "' + expected + '".';
            return result;
          }};
      }
    });
  });
  function countScopes(s, count) {
    if (s !== null) {
      s = s.$$childHead;
      while (s !== null) {
        count = countScopes(s, count);
        s = s.$$nextSibling;
      }
    }
    return ++count;
  }
  function d() {
    var args = Array.prototype.slice.call(arguments);
    var time = new Date().toISOString();
    console.log(time + ' - ' + 'break' + ': ' + console.log.call(console, args.length === 1 ? args[0] : args, false, 10, true));
  }
  function dd() {
    d.apply(null, arguments);
    var stack = new Error().stack.split('\n');
    stack.splice(1, 1);
    console.log(stack.join('\n'));
    process.exit(1);
  }
})(require('process'));
