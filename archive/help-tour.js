/* @flow */
import {helpTourButton, helpTour} from './help-tour.component';

let helpTourModule = angular.module('helpTour', ['ngSanitize'])
  .directive('helpTourButton', [helpTourButton])
  .directive('helpTour', [helpTour]);

export default helpTourModule;
