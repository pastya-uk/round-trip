/* */ 
"format cjs";
'use strict';

angular.module('.tour', ['pastya.roundTrip.triphop'])

  .provider('$triphop', function() {

    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      // uncommenting the next two lines will break backwards compatability
      // prefixClass: 'triphop',
      // prefixEvent: 'triphop',
      container: false,
      target: false,
      placement: 'right',
      templateUrl: 'triphop/triphop.tpl.html',
      contentTemplate: false,
      trigger: 'click',
      keyboard: true,
      html: false,
      title: '',
      content: '',
      delay: 0,
      autoClose: false
    };

    this.$get = function($basehop) {

      function PopoverFactory(element, config) {
        // Common vars
        var options = angular.extend({}, defaults, config);
        var $triphop = $basehop(element, options);

        // Support scope as string options [/*title, */content]
        if(options.content) {
          $triphop.$scope.content = options.content;
        }
        return $triphop;
      }
      return PopoverFactory;
    };

  })

  .directive('bsPopover', function($window, $sce, $triphop) {

    var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;

    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr) {

        // Directive options
        var options = {scope: scope};
        angular.forEach(['template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'customClass', 'autoClose', 'id', 'prefixClass', 'prefixEvent'], function(key) {
          if(angular.isDefined(attr[key])) options[key] = attr[key];
        });

        // use string regex match boolean attr falsy values, leave truthy values be
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach(['html', 'container', 'autoClose'], function(key) {
          if(angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key]))
            options[key] = false;
        });

        // should not parse target attribute (anchor tag), only data-target #1454
        var dataTarget = element.attr('data-target');
        if(angular.isDefined(dataTarget)) {
          if(falseValueRegExp.test(dataTarget))
            options.target = false;
          else
            options.target = dataTarget;
        }

        // Support scope as data-attrs
        angular.forEach(['title', 'content'], function(key) {
          attr[key] && attr.$observe(key, function(newValue, oldValue) {
            scope[key] = $sce.trustAsHtml(newValue);
            angular.isDefined(oldValue) && requestAnimationFrame(function() {
              triphop && triphop.$applyPlacement();
            });
          });
        });

        // Support scope as an object
        attr.bsPopover && scope.$watch(attr.bsPopover, function(newValue, oldValue) {
          if(angular.isObject(newValue)) {
            angular.extend(scope, newValue);
          } else {
            scope.content = newValue;
          }
          angular.isDefined(oldValue) && requestAnimationFrame(function() {
            triphop && triphop.$applyPlacement();
          });
        }, true);

        // Visibility binding support
        attr.bsShow && scope.$watch(attr.bsShow, function(newValue, oldValue) {
          if(!triphop || !angular.isDefined(newValue)) return;
          if(angular.isString(newValue)) newValue = !!newValue.match(/true|,?(triphop),?/i);
          newValue === true ? triphop.show() : triphop.hide();
        });

        // Viewport support
        attr.viewport && scope.$watch(attr.viewport, function (newValue) {
          if(!triphop || !angular.isDefined(newValue)) return;
          triphop.setViewport(newValue);
        });

        // Initialize triphop
        var triphop = $triphop(element, options);

        // Garbage collection
        scope.$on('$destroy', function() {
          if (triphop) triphop.destroy();
          options = null;
          triphop = null;
        });

      }
    };

  });
