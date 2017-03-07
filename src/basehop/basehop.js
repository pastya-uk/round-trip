/* */ 
(function(process) {
  'use strict';
  angular.module('pastya.roundTrip.basehop', ['pastya.roundTrip.core', 'pastya.roundTrip.helpers.dimensions']).provider('$basehop', function() {
    var defaults = this.defaults = {
      animation: 'am-fade',
      customClass: '',
      prefixClass: 'basehop',
      prefixEvent: 'basehop',
      container: false,
      target: false,
      placement: 'top',
      templateUrl: 'basehop/basehop.tpl.html',
      template: '',
      contentTemplate: false,
      trigger: 'hover focus',
      keyboard: false,
      html: false,
      show: false,
      title: '',
      type: '',
      delay: 0,
      autoClose: false,
      bsEnabled: true,
      viewport: {
        selector: 'body',
        padding: 0
      }
    };
    this.$get = function($window, $rootScope, $bsCompiler, $q, $templateCache, $http, $animate, $sce, dimensions, $$rAF, $timeout) {
      var trim = String.prototype.trim;
      var isTouch = 'createTouch' in $window.document;
      var htmlReplaceRegExp = /ng-bind="/ig;
      var $body = angular.element($window.document);
      function BasehopFactory(element, config) {
        var $basehop = {};
        var options = $basehop.$options = angular.extend({}, defaults, config);
        var promise = $basehop.$promise = $bsCompiler.compile(options);
        var scope = $basehop.$scope = options.scope && options.scope.$new() || $rootScope.$new();
        var nodeName = element[0].nodeName.toLowerCase();
        if (options.delay && angular.isString(options.delay)) {
          var split = options.delay.split(',').map(parseFloat);
          options.delay = split.length > 1 ? {
            show: split[0],
            hide: split[1]
          } : split[0];
        }
        $basehop.$id = options.id || element.attr('id') || '';
        if (options.title) {
          scope.title = $sce.trustAsHtml(options.title);
        }
        scope.$setEnabled = function(isEnabled) {
          scope.$$postDigest(function() {
            $basehop.setEnabled(isEnabled);
          });
        };
        scope.$hide = function() {
          scope.$$postDigest(function() {
            $basehop.hide();
          });
        };
        scope.$show = function() {
          scope.$$postDigest(function() {
            $basehop.show();
          });
        };
        scope.$toggle = function() {
          scope.$$postDigest(function() {
            $basehop.toggle();
          });
        };
        $basehop.$isShown = scope.$isShown = false;
        var timeout,
            hoverState;
        var compileData,
            hopElement,
            hopContainer,
            hopScope;
        promise.then(function(data) {
          compileData = data;
          $basehop.init();
        });
        $basehop.init = function() {
          if (options.delay && angular.isNumber(options.delay)) {
            options.delay = {
              show: options.delay,
              hide: options.delay
            };
          }
          if (options.container === 'self') {
            hopContainer = element;
          } else if (angular.isElement(options.container)) {
            hopContainer = options.container;
          } else if (options.container) {
            hopContainer = findElement(options.container);
          }
          bindTriggerEvents();
          if (options.target) {
            options.target = angular.isElement(options.target) ? options.target : findElement(options.target);
          }
          if (options.show) {
            scope.$$postDigest(function() {
              options.trigger === 'focus' ? element[0].focus() : $basehop.show();
            });
          }
        };

        $basehop.destroy = function() {
          unbindTriggerEvents();
          destroyHopElement();
          scope.$destroy();
        };

        $basehop.enter = function() {
          clearTimeout(timeout);
          hoverState = 'in';
          if (!options.delay || !options.delay.show) {
            return $basehop.show();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'in')
              $basehop.show();
          }, options.delay.show);
        };

        $basehop.show = function() {
          if (!options.bsEnabled || $basehop.$isShown)
            return;
          scope.$emit(options.prefixEvent + '.show.before', $basehop);
          var parent,
              after;
          if (options.container) {
            parent = hopContainer;
            if (hopContainer[0].lastChild) {
              after = angular.element(hopContainer[0].lastChild);
            } else {
              after = null;
            }
          } else {
            parent = null;
            after = element;
          }
          if (hopElement)
            destroyHopElement();
          hopScope = $basehop.$scope.$new();
          hopElement = $basehop.$element = compileData.link(hopScope, function(clonedElement, scope) {});
          hopElement.css({
            top: '-9999px',
            left: '-9999px',
            right: 'auto',
            display: 'block',
            visibility: 'hidden'
          });
          if (options.animation)
            hopElement.addClass(options.animation);
          if (options.type)
            hopElement.addClass(options.prefixClass + '-' + options.type);
          if (options.customClass)
            hopElement.addClass(options.customClass);
          after ? after.after(hopElement) : parent.prepend(hopElement);
          $basehop.$isShown = scope.$isShown = true;
          safeDigest(scope);
          $basehop.$applyPlacement();
          if (angular.version.minor <= 2) {
            $animate.enter(hopElement, parent, after, enterAnimateCallback);
          } else {
            $animate.enter(hopElement, parent, after).then(enterAnimateCallback);
          }
          safeDigest(scope);
          $$rAF(function() {
            if (hopElement)
              hopElement.css({visibility: 'visible'});
            if (options.keyboard) {
              if (options.trigger !== 'focus') {
                $basehop.focus();
              }
              bindKeyboardEvents();
            }
          });
          if (options.autoClose) {
            bindAutoCloseEvents();
          }
        };

        function enterAnimateCallback() {
          scope.$emit(options.prefixEvent + '.show', $basehop);
        }

        $basehop.leave = function() {
          clearTimeout(timeout);
          hoverState = 'out';
          if (!options.delay || !options.delay.hide) {
            return $basehop.hide();
          }
          timeout = setTimeout(function() {
            if (hoverState === 'out') {
              $basehop.hide();
            }
          }, options.delay.hide);
        };

        var _blur;
        var _hopToHide;
        $basehop.hide = function(blur) {
          if (!$basehop.$isShown)
            return;
          scope.$emit(options.prefixEvent + '.hide.before', $basehop);
          _blur = blur;
          _hopToHide = hopElement;
          if (angular.version.minor <= 2) {
            $animate.leave(hopElement, leaveAnimateCallback);
          } else {
            $animate.leave(hopElement).then(leaveAnimateCallback);
          }
          $basehop.$isShown = scope.$isShown = false;
          safeDigest(scope);
          if (options.keyboard && hopElement !== null) {
            unbindKeyboardEvents();
          }
          if (options.autoClose && hopElement !== null) {
            unbindAutoCloseEvents();
          }
        };

        function leaveAnimateCallback() {
          scope.$emit(options.prefixEvent + '.hide', $basehop);
          if (hopElement === _hopToHide) {
            if (_blur && options.trigger === 'focus') {
              return element[0].blur();
            }
            destroyHopElement();
          }
        }

        $basehop.toggle = function() {
          $basehop.$isShown ? $basehop.leave() : $basehop.enter();
        };

        $basehop.focus = function() {
          hopElement[0].focus();
        };

        $basehop.setEnabled = function(isEnabled) {
          options.bsEnabled = isEnabled;
        };

        $basehop.setViewport = function(viewport) {
          options.viewport = viewport;
        };

        $basehop.$applyPlacement = function() {
          if (!hopElement)
            return;
          var placement = options.placement,
              autoToken = /\s?auto?\s?/i,
              autoPlace = autoToken.test(placement);
          if (autoPlace) {
            placement = placement.replace(autoToken, '') || defaults.placement;
          }
          hopElement.addClass(options.placement);
          var elementPosition = getPosition(),
              hopWidth = hopElement.prop('offsetWidth'),
              hopHeight = hopElement.prop('offsetHeight');
          $basehop.$viewport = options.viewport && findElement(options.viewport.selector || options.viewport);
          if (autoPlace) {
            var originalPlacement = placement;
            var viewportPosition = getPosition($basehop.$viewport);
            if (/top/.test(originalPlacement) && elementPosition.bottom + hopHeight > viewportPosition.bottom) {
              placement = originalPlacement.replace('top', 'bottom');
            } else if (/bottom/.test(originalPlacement) && elementPosition.top - hopHeight < viewportPosition.top) {
              placement = originalPlacement.replace('bottom', 'top');
            }
            if (/left/.test(originalPlacement) && elementPosition.left - hopWidth < viewportPosition.left) {
              placement = placement.replace('left', 'right');
            } else if (/right/.test(originalPlacement) && elementPosition.right + hopWidth > viewportPosition.width) {
              placement = placement.replace('right', 'left');
            }
            hopElement.removeClass(originalPlacement).addClass(placement);
          }
          var hopPosition = getCalculatedOffset(placement, elementPosition, hopWidth, hopHeight);
          applyPlacement(hopPosition, placement);
        };

        $basehop.$onKeyUp = function(evt) {
          if (evt.which === 27 && $basehop.$isShown) {
            $basehop.hide();
            evt.stopPropagation();
          }
        };

        $basehop.$onFocusKeyUp = function(evt) {
          if (evt.which === 27) {
            element[0].blur();
            evt.stopPropagation();
          }
        };

        $basehop.$onFocusElementMouseDown = function(evt) {
          evt.preventDefault();
          evt.stopPropagation();
          $basehop.$isShown ? element[0].blur() : element[0].focus();
        };

        function bindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          angular.forEach(triggers, function(trigger) {
            if (trigger === 'click') {
              element.on('click', $basehop.toggle);
            } else if (trigger !== 'manual') {
              element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $basehop.enter);
              element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $basehop.leave);
              nodeName === 'button' && trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $basehop.$onFocusElementMouseDown);
            }
          });
        }

        function unbindTriggerEvents() {
          var triggers = options.trigger.split(' ');
          for (var i = triggers.length; i--; ) {
            var trigger = triggers[i];
            if (trigger === 'click') {
              element.off('click', $basehop.toggle);
            } else if (trigger !== 'manual') {
              element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $basehop.enter);
              element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $basehop.leave);
              nodeName === 'button' && trigger !== 'hover' && element.off(isTouch ? 'touchstart' : 'mousedown', $basehop.$onFocusElementMouseDown);
            }
          }
        }

        function bindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            hopElement.on('keyup', $basehop.$onKeyUp);
          } else {
            element.on('keyup', $basehop.$onFocusKeyUp);
          }
        }

        function unbindKeyboardEvents() {
          if (options.trigger !== 'focus') {
            hopElement.off('keyup', $basehop.$onKeyUp);
          } else {
            element.off('keyup', $basehop.$onFocusKeyUp);
          }
        }

        var _autoCloseEventsBinded = false;
        function bindAutoCloseEvents() {
          $timeout(function() {
            hopElement.on('click', stopEventPropagation);
            $body.on('click', $basehop.hide);
            _autoCloseEventsBinded = true;
          }, 0, false);
        }

        function unbindAutoCloseEvents() {
          if (_autoCloseEventsBinded) {
            hopElement.off('click', stopEventPropagation);
            $body.off('click', $basehop.hide);
            _autoCloseEventsBinded = false;
          }
        }

        function stopEventPropagation(event) {
          event.stopPropagation();
        }

        function getPosition($element) {
          $element = $element || (options.target || element);
          var el = $element[0],
              isBody = el.tagName === 'BODY';
          var elRect = el.getBoundingClientRect();
          var rect = {};
          for (var p in elRect) {
            rect[p] = elRect[p];
          }
          if (rect.width === null) {
            rect = angular.extend({}, rect, {
              width: elRect.right - elRect.left,
              height: elRect.bottom - elRect.top
            });
          }
          var elOffset = isBody ? {
            top: 0,
            left: 0
          } : dimensions.offset(el),
              scroll = {scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.prop('scrollTop') || 0},
              outerDims = isBody ? {
                width: document.documentElement.clientWidth,
                height: $window.innerHeight
              } : null;
          return angular.extend({}, rect, scroll, outerDims, elOffset);
        }

        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
          var offset;
          var split = placement.split('-');
          switch (split[0]) {
            case 'right':
              offset = {
                top: position.top + position.height / 2 - actualHeight / 2,
                left: position.left + position.width
              };
              break;
            case 'bottom':
              offset = {
                top: position.top + position.height,
                left: position.left + position.width / 2 - actualWidth / 2
              };
              break;
            case 'left':
              offset = {
                top: position.top + position.height / 2 - actualHeight / 2,
                left: position.left - actualWidth
              };
              break;
            default:
              offset = {
                top: position.top - actualHeight,
                left: position.left + position.width / 2 - actualWidth / 2
              };
              break;
          }
          if (!split[1]) {
            return offset;
          }
          if (split[0] === 'top' || split[0] === 'bottom') {
            switch (split[1]) {
              case 'left':
                offset.left = position.left;
                break;
              case 'right':
                offset.left = position.left + position.width - actualWidth;
            }
          } else if (split[0] === 'left' || split[0] === 'right') {
            switch (split[1]) {
              case 'top':
                offset.top = position.top - actualHeight + position.height;
                break;
              case 'bottom':
                offset.top = position.top;
            }
          }
          return offset;
        }

        function applyPlacement(offset, placement) {
          var hop = hopElement[0],
              width = hop.offsetWidth,
              height = hop.offsetHeight;
          var marginTop = parseInt(dimensions.css(hop, 'margin-top'), 10),
              marginLeft = parseInt(dimensions.css(hop, 'margin-left'), 10);
          if (isNaN(marginTop))
            marginTop = 0;
          if (isNaN(marginLeft))
            marginLeft = 0;
          offset.top = offset.top + marginTop;
          offset.left = offset.left + marginLeft;
          dimensions.setOffset(hop, angular.extend({using: function(props) {
              hopElement.css({
                top: Math.round(props.top) + 'px',
                left: Math.round(props.left) + 'px',
                right: ''
              });
            }}, offset), 0);
          var actualWidth = hop.offsetWidth,
              actualHeight = hop.offsetHeight;
          if (placement === 'top' && actualHeight !== height) {
            offset.top = offset.top + height - actualHeight;
          }
          if (/top-left|top-right|bottom-left|bottom-right/.test(placement))
            return;
          var delta = getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
          if (delta.left) {
            offset.left += delta.left;
          } else {
            offset.top += delta.top;
          }
          dimensions.setOffset(hop, offset);
          if (/top|right|bottom|left/.test(placement)) {
            var isVertical = /top|bottom/.test(placement),
                arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight,
                arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight';
            replaceArrow(arrowDelta, hop[arrowOffsetPosition], isVertical);
          }
        }

        function getViewportAdjustedDelta(placement, position, actualWidth, actualHeight) {
          var delta = {
            top: 0,
            left: 0
          };
          if (!$basehop.$viewport)
            return delta;
          var viewportPadding = options.viewport && options.viewport.padding || 0;
          var viewportDimensions = getPosition($basehop.$viewport);
          if (/right|left/.test(placement)) {
            var topEdgeOffset = position.top - viewportPadding - viewportDimensions.scroll;
            var bottomEdgeOffset = position.top + viewportPadding - viewportDimensions.scroll + actualHeight;
            if (topEdgeOffset < viewportDimensions.top) {
              delta.top = viewportDimensions.top - topEdgeOffset;
            } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
              delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset;
            }
          } else {
            var leftEdgeOffset = position.left - viewportPadding;
            var rightEdgeOffset = position.left + viewportPadding + actualWidth;
            if (leftEdgeOffset < viewportDimensions.left) {
              delta.left = viewportDimensions.left - leftEdgeOffset;
            } else if (rightEdgeOffset > viewportDimensions.right) {
              delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset;
            }
          }
          return delta;
        }
        function replaceArrow(delta, dimension, isHorizontal) {
          var $arrow = findElement('.base-hop-arrow, .arrow', hopElement[0]);
          $arrow.css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%').css(isHorizontal ? 'top' : 'left', '');
        }
        function destroyHopElement() {
          clearTimeout(timeout);
          if ($basehop.$isShown && hopElement !== null) {
            if (options.autoClose) {
              unbindAutoCloseEvents();
            }
            if (options.keyboard) {
              unbindKeyboardEvents();
            }
          }
          if (hopScope) {
            hopScope.$destroy();
            hopScope = null;
          }
          if (hopElement) {
            hopElement.remove();
            hopElement = $basehop.$element = null;
          }
        }
        return $basehop;
      }
      function safeDigest(scope) {
        scope.$$phase || (scope.$root && scope.$root.$$phase) || scope.$digest();
      }
      function findElement(query, element) {
        return angular.element((element || document).querySelectorAll(query));
      }
      var fetchPromises = {};
      function fetchTemplate(template) {
        if (fetchPromises[template])
          return fetchPromises[template];
        return (fetchPromises[template] = $http.get(template, {cache: $templateCache}).then(function(res) {
          return res.data;
        }));
      }
      return BasehopFactory;
    };
  }).directive('basehop', function($window, $location, $sce, $basehop, $$rAF) {
    return {
      restrict: 'EAC',
      scope: true,
      link: function postLink(scope, element, attr, transclusion) {
        var options = {scope: scope};
        angular.forEach(['template', 'templateUrl', 'controller', 'controllerAs', 'contentTemplate', 'placement', 'container', 'delay', 'trigger', 'html', 'animation', 'backdropAnimation', 'type', 'customClass', 'id'], function(key) {
          if (angular.isDefined(attr[key]))
            options[key] = attr[key];
        });
        var falseValueRegExp = /^(false|0|)$/i;
        angular.forEach(['html', 'container'], function(key) {
          if (angular.isDefined(attr[key]) && falseValueRegExp.test(attr[key]))
            options[key] = false;
        });
        var dataTarget = element.attr('data-target');
        if (angular.isDefined(dataTarget)) {
          if (falseValueRegExp.test(dataTarget))
            options.target = false;
          else
            options.target = dataTarget;
        }
        if (!scope.hasOwnProperty('title')) {
          scope.title = '';
        }
        attr.$observe('title', function(newValue) {
          if (angular.isDefined(newValue) || !scope.hasOwnProperty('title')) {
            var oldValue = scope.title;
            scope.title = $sce.trustAsHtml(newValue);
            angular.isDefined(oldValue) && $$rAF(function() {
              basehop && basehop.$applyPlacement();
            });
          }
        });
        attr.basehop && scope.$watch(attr.basehop, function(newValue, oldValue) {
          if (angular.isObject(newValue)) {
            angular.extend(scope, newValue);
          } else {
            scope.title = newValue;
          }
          angular.isDefined(oldValue) && $$rAF(function() {
            tooltip && tooltip.$applyPlacement();
          });
        }, true);
        attr.showHop && scope.$watch(attr.showHop, function(newValue, oldValue) {
          if (!basehop || !angular.isDefined(newValue))
            return;
          if (angular.isString(newValue))
            newValue = !!newValue.match(/true|,?(basehop),?/i);
          newValue === true ? basehop.show() : basehop.hide();
        });
        attr.enableHop && scope.$watch(attr.enableHop, function(newValue, oldValue) {
          if (!basehop || !angular.isDefined(newValue))
            return;
          if (angular.isString(newValue))
            newValue = !!newValue.match(/true|1|,?(basehop),?/i);
          newValue === false ? basehop.setEnabled(false) : basehop.setEnabled(true);
        });
        attr.viewport && scope.$watch(attr.viewport, function(newValue) {
          if (!tooltip || !angular.isDefined(newValue))
            return;
          tooltip.setViewport(newValue);
        });
        var basehop = $basehop(element, options);
        scope.$on('$destroy', function() {
          if (basehop)
            basehop.destroy();
          options = null;
          basehop = null;
        });
      }
    };
  });
})(require('process'));
