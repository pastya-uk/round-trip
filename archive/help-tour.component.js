/* @flow */
import helpTourController from './help-tour.controller';
const COMPONENT_PATH = 'app/common/help-tour';

export function helpTourButton(): Object {
  return {
    transclude: true,
    restrict: 'E',
    templateUrl: `${COMPONENT_PATH}/help-tour.button.html`,
    controller: helpTourController,
    controllerAs: 'vm',
    bindToController: true,
    scope: {}
  };
};
export function helpTour(): Object {
  return {
    transclude: true,
    restrict: 'E',
    templateUrl: `${COMPONENT_PATH}/help-tour.html`,
    controller: helpTourController,
    controllerAs: 'vm',
    bindToController: true
  };
};
export function helpTourExitButton(): Object {
  return {
    restrict: 'E',
    templateUrl: `${COMPONENT_PATH}/help-tour-exit.button.html`,
    controller: helpTourController,
    controllerAs: 'vm',
    bindToController: true,
    scope: {
      customClass: '@class'
    }
  };
};
