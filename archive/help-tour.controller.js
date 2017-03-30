/* @flow */
import {
  assign,
  cloneDeep,
  without
} from 'lodash';
import {HelpTourConfigItem, TOUR_CONFIG, TOUR_OPTIONS} from './help-tour.config';

class HelpTourController {
  static $inject: Array<string>;
  defaultTourTemplateUrl: string;
  defaultTitleTemplateUrl: string;
  helpTourConfig: Object;

  // private elements
  _currCtxTourConfig: Array<HelpTourConfigItem>;
  _tourItems: Array<HelpTourConfigItem>; // Stores the step details for the current url
  _currStepNo: number;
  _baseElement: Object;
  _bodyRect: Object;
  _elemRect: Object;
  _offsetTop: number;
  _onKeyDown: Object;

  constructor(UserService, $location, $timeout, $scope, $filter, $sce, $sanitize) {
    let mainUserRole = UserService.getMainUserRole();

    assign(this, {
      $location,
      $timeout,
      $scope,
      $filter,
      $sce,
      $sanitize
    });
    this.helpTourConfig = TOUR_CONFIG[mainUserRole];
  }

  /**
   * This method initialize the current context config based on the location path.
   * @method startHelpTour
   * @returns {void} no return from this method
   */
  startHelpTour() {
    this._currCtxTourConfig = this.helpTourConfig[this.$location.path().replace('/', '')];
    if (typeof(this._currCtxTourConfig) === 'undefined') {
      this._exitTour();
    } else {
      this._initializeTourElements();
      if (this._initializeTourBaseLayers()) { // Once base layers are added successfully
        if (this._initializeTourBaseComponents()) {
          this._nextStep(); // Immediately go to the next step
        } else {
          this._exitTour(); // Exit the tour if the base components initialization failed
        }
      }
    }
  }

  /**
   * Initialize the steps for the tour from provided configuration file
   * @method _initializeTourElements
   * @returns {void} no return from this method
   */
  _initializeTourElements() {
    let tourItems = [];
    let stepsLength = this._currCtxTourConfig.length;

    if (stepsLength == 0) {
      this._exitTour();
    } else {
      // use the first step which could be parsed
      for (let i = 0; i < stepsLength; i++) {
        let currentCtxItem = cloneDeep(this._currCtxTourConfig[i]);

        // set the step
        currentCtxItem.step = tourItems.length + 1;
        // use querySelector function when selector is given
        if (typeof(currentCtxItem.selector) !== 'undefined' || currentCtxItem.selector != null) {
          currentCtxItem.element = this._findElement(currentCtxItem.selectorType, currentCtxItem.selector);
        }

        // Tour step where element is not provided or not found
        if (typeof(currentCtxItem.element) === 'undefined' || currentCtxItem.element == null) {
          let tourFloatingElement = document.querySelector('.tour-floating-element');

          if (tourFloatingElement == null) {
            tourFloatingElement = document.createElement('div');
            tourFloatingElement.className = 'tour-floating-element';
            document.body.appendChild(tourFloatingElement);
          }
          currentCtxItem.element = tourFloatingElement;
          currentCtxItem.position = 'floating';
        }
        if (currentCtxItem.element != null) {
          tourItems.push(currentCtxItem);
        }
      }
      // set the tour elements
      this._tourItems = tourItems;
      // Base element to which all the base layer will be added
      // In normal circumstances its the body or else it is the
      // the provided base selector for the step.
      this._baseElement = document.body;
      return;
    }
  }

  _initializeTourBaseLayers() {
    if (typeof (this._baseElement) === 'undefined' || this._baseElement == null) {
      return false;
    }
    return this._addOverlayLayer() && this._addHelperLayer() && this._addHelperReferenceLayer();
  }

  _initializeTourBaseComponents() {
    if (TOUR_OPTIONS.SHOW_STEP_NUMBERS === true) {
      this._addTourTooltipNumberLayer();
    }
    this._addExitButtonContainer();
    this._addTourTooltipContainer();
    return true;
  }

  /**
   * Go to the next step
   * @method _nextStep
   * @returns {void} no return
   */
  _nextStep() {
    this._direction = 'forward';
    if (typeof(this._currStepNo) === 'undefined' || this._currStepNo == null) {
      this._currStepNo = 0;
    } else {
      ++this._currStepNo;
    }
    if (this._currStepNo >= this._tourItems.length && this._tourItems.length > 0) {
      this._exitTour();
      return;
    }
    let tourStep = this._tourItems[this._currStepNo];

    this._clearPreviousStep();
    this._repositionBaseLayers(tourStep);
    this._addTooltipHeader(tourStep);
    this._addTooltipContent(tourStep);
    this._addTooltipFooter(tourStep);
    this._addTourProgressLayer();
    this._addNavigationLayer();
    this._addTooltipArrow();
    this._repositionTooltip(tourStep);
    this._highlightTargetElement(tourStep);
  }

  _clearPreviousStep() {
    let fixParents = document.querySelectorAll('.tour-fix-parent');
    let oldShowElements = document.querySelectorAll('.tour-show-element');
    let oldTourRelPositions = document.querySelectorAll('.tour-relative-position');

    if (fixParents && fixParents.length > 0) {
      for (let i = fixParents.length - 1; i >= 0; i--) {
        fixParents[i].className = fixParents[i].className.replace(/tour-fix-parent/g, '').replace(/^\s+|\s+$/g, '');
      };
    }
    if (oldShowElements && oldShowElements.length > 0) {
      for (let i = oldShowElements.length - 1; i >= 0; i--) {
        oldShowElements[i].className = oldShowElements[i].className.replace(/tour-show-element/g, '').replace(/^\s+|\s+$/g, '');
      }
    }
    if (oldTourRelPositions && oldTourRelPositions.length > 0) {
      for (let i = oldTourRelPositions.length - 1; i >= 0; i--) {
        oldTourRelPositions[i].className = oldTourRelPositions[i].className.replace(/tour-relative-position/g, '').replace(/^\s+|\s+$/g, '');
      }
    }
  }

  /**
   * Go to the previous step
   * @method _previousStep
   * @returns {boolean} true or false
   */
  _previousStep() {
    return true;
  }

  /**
   * Go to the provided step
   * @method _goToStep
   * @param {int} stepNo
   * @returns {void} no return
   */
  _goToStep() {

  }

  /**
   * Exit the tour as we have reached the last step
   * @method _exitTour
   * @param {HTMLElement} targetElement
   * @returns {void} no return
   */
  _exitTour() {
    // set the step to zero
    this._currStepNo = undefined;
    if (typeof(this._baseElement) === 'undefined' || this._baseElement == null) {
      return;
    }
    // remove overlay from the page
    let overlay = this._baseElement.querySelector('.tour-overlay');

    // return if tour has already completed or skipped
    if (overlay == null) {
      return;
    }
    // for fade-out animation
    overlay.style.opacity = 0;
    this.$timeout(function () {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 50, false);
    let tourHelperLayer = this._baseElement.querySelector('.tour-helper-layer');
    let tourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourDisableInteractionLayer = this._baseElement.querySelector('.tour-disable-interaction-layer');
    let tourFloatingElement = document.querySelector('.tour-floating-element');
    let tourShowElements = document.querySelectorAll('.tour-show-element');
    let tourFixParents = document.querySelectorAll('.tour-fix-parent');
    let tourRelativePostion = document.querySelector('.tour-relative-position');

    // remove helper layer
    if (tourHelperLayer) {
      tourHelperLayer.parentNode.removeChild(tourHelperLayer);
    }
    // remove reference layer
    if (tourTooltipReferenceLayer) {
      tourTooltipReferenceLayer.parentNode.removeChild(tourTooltipReferenceLayer);
    }
    // remove disable interaction layer
    if (tourDisableInteractionLayer) {
      tourDisableInteractionLayer.parentNode.removeChild(tourDisableInteractionLayer);
    }
    // remove floating element
    if (tourFloatingElement) {
      tourFloatingElement.parentNode.removeChild(tourFloatingElement);
    }
    // remove all `tour-show-element` class from the document
    if (tourShowElements && tourShowElements.length > 0) {
      for (let i = tourShowElements.length - 1; i >= 0; i--) {
        tourShowElements[i].className = tourShowElements[i].className.replace(/tour-show-element/g, '').replace(/^\s+|\s+$/g, '');
      }
    }
    // remove `tour-relative-position` class from the element
    if (tourRelativePostion) {
      tourRelativePostion.className = tourRelativePostion.className.replace(/tour-relative-position/g, '').replace(/^\s+|\s+$/g, ''); // This is a manual trim.
    }
    // remove all `fix-parent` class from the document
    if (tourFixParents && tourFixParents.length > 0) {
      for (let i = tourFixParents.length - 1; i >= 0; i--) {
        tourFixParents[i].className = tourFixParents[i].className.replace(/tour-fix-parent/g, '').replace(/^\s+|\s+$/g, '');
      }
    }
    // clean listeners
    if (window.removeEventListener) {
      window.removeEventListener('keydown', this._onKeyDown, true);
    } else if (document.detachEvent) { // IE
      document.detachEvent('onkeydown', this._onKeyDown);
    }
    return;
  }

  /**
   * Add overlay to the page highlighting provided element.
   * @method _addOverlayLayer
   * @returns {boolean} true or null
   */
  _addOverlayLayer() {
    let self = this;
    let overlay = document.createElement('div');
    let styleText = '';

    // set css class name
    overlay.className = 'tour-overlay';
    styleText += 'top: 0; bottom: 0; left: 0; right: 0; position: fixed;';
    overlay.setAttribute('style', styleText);
    this._baseElement.appendChild(overlay);
    overlay.onclick = function() {
      if (TOUR_OPTIONS.EXIT_ON_OVERLAY_CLICK == true) {
        self._exitTour();
      }
    };
    this.$timeout(function() {
      styleText += ` opacity: ${TOUR_OPTIONS.OVERLAY_OPACITY.toString()};`;
      overlay.setAttribute('style', styleText);
    }, 10, false);
    return true;
  }

  /**
   * Add a div highlighinting the element for which the
   * help is added for.
   * @method _addHelperLayer
   * @returns {boolean} true or null
   */
  _addHelperLayer() {
    let oldTourHelperLayer = document.querySelector('.tour-helper-layer');
    let highlightClass = 'tour-helper-layer';

    // check for options highlight class
    if (typeof (TOUR_OPTIONS.HIGHLIGHT_CLASS) === 'string') {
      highlightClass += ` ${TOUR_OPTIONS.HIGHLIGHT_CLASS}`;
    }
    if (oldTourHelperLayer != null) {
      oldTourHelperLayer.className = highlightClass;
    } else {
      let tourHelperLayer = document.createElement('div');

      tourHelperLayer.className = highlightClass;
      this._baseElement.appendChild(tourHelperLayer);
    }
    return true;
  }

  /**
   * Add a helper reference layer which is going to used to provide
   * a reference layer for other tooltip elements.
   * @method _addHelperReferenceLayer
   * @returns {boolean} true or null
   */
  _addHelperReferenceLayer() {
    let oldTourTooltipReferenceLayer = document.querySelector('.tour-tooltip-reference-layer');

    if (oldTourTooltipReferenceLayer == null) {
      let tourTooltipReferenceLayer = document.createElement('div');

      tourTooltipReferenceLayer.className = 'tour-tooltip-reference-layer row';
      this._baseElement.appendChild(tourTooltipReferenceLayer);
    }
    return true;
  }

  /**
   * Reposition the base layers according to the shown element
   *
   * @method _repositionBaseLayers
   * @param {Object} tourStep
   * @returns {void} no return
   */
  _repositionBaseLayers(tourStep) {
    let baseTourHelperLayer = document.querySelector('.tour-helper-layer');
    let baseTourTooltipReferenceLayer = document.querySelector('.tour-tooltip-reference-layer');
    let highlightClass = 'tour-helper-layer';

    // Check for the current step highlight class
    if (typeof (tourStep.highlightClass) === 'string') {
      highlightClass += ` ${tourStep.highlightClass}`;
    }
    // check for options highlight class
    if (typeof (TOUR_OPTIONS.HIGHLIGHT_CLASS) === 'string') {
      highlightClass += ` ${TOUR_OPTIONS.HIGHLIGHT_CLASS}`;
    }
    this._setLayerPosition(tourStep, baseTourHelperLayer);
    this._setLayerPosition(tourStep, baseTourTooltipReferenceLayer);
  }

  /**
   * Add the tooltip container to the reference layer
   *
   * @method _addTourTooltipContainer
   * @returns {boolean} true or false
   */
  _addTourTooltipContainer() {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipClass = 'tour-tooltip';

    // check for options highlight class
    if (typeof (TOUR_OPTIONS.TOOLTIP_CLASS) === 'string') {
      tooltipClass += ` ${TOUR_OPTIONS.TOOLTIP_CLASS}`;
    }
    if (tourTooltipContainer == null) {
      tourTooltipContainer = document.createElement('div');
    }
    tourTooltipContainer.className = tooltipClass;
    baseTourTooltipReferenceLayer.appendChild(tourTooltipContainer);
    return true;
  }

  /**
   * Add the step number at the top of the tooltip container
   * @method _addTourTooltipNumberLayer
   * @returns {boolean} true or false
   */
  _addTourTooltipNumberLayer() {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipNumberLayer = baseTourTooltipReferenceLayer.querySelector('.tour-helper-number-layer');

    if (tourTooltipNumberLayer == null) {
      tourTooltipNumberLayer = document.createElement('span');
    }
    tourTooltipNumberLayer.className = 'tour-helper-number-layer';
    baseTourTooltipReferenceLayer.appendChild(tourTooltipNumberLayer);
    return true;
  }

  _addExitButtonContainer() {
    let self = this;
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourExitButtonLayer = baseTourTooltipReferenceLayer.querySelector('.tour-exit-button-layer');
    let skipButton = baseTourTooltipReferenceLayer.querySelector('.tour-skip-button');
    let exitLabel = this._getTranslatedString(`${TOUR_OPTIONS.EXIT_LABEL}`);

    if (tourExitButtonLayer == null) {
      tourExitButtonLayer = document.createElement('div');
    }
    tourExitButtonLayer.className = 'tour-exit-button-layer';

    // Skip button
    if (skipButton == null) {
      skipButton = document.createElement('a');
    }
    skipButton.onclick = function() {
      self._exitTour();
    };
    skipButton.href = 'javascript:void(0);';
    skipButton.className = 'tour-skip-button';
    skipButton.innerHTML = `<i class=\'fa fa-close\'></i> ${exitLabel}`;

    tourExitButtonLayer.appendChild(skipButton);
    baseTourTooltipReferenceLayer.appendChild(tourExitButtonLayer);

    return true;
  }

  _addTooltipHeader(tourStep) {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipHeaderClass = 'tour-tooltip-header';
    let tourTooltipHeader = tourTooltipContainer.querySelector('.tour-tooltip-header');
    let tourTooltipHeaderText = this._getTranslatedString(tourStep.heading);

    if (typeof (TOUR_OPTIONS.TOOLTIP_HEADER_CLASS) === 'string') {
      tooltipHeaderClass += ` ${TOUR_OPTIONS.TOOLTIP_HEADER_CLASS}`;
    }
    if (tourTooltipHeader == null) {
      tourTooltipHeader = document.createElement('div');
    }
    tourTooltipHeader.className = tooltipHeaderClass;
    tourTooltipHeader.innerHTML = `<h3>${tourTooltipHeaderText}</h3>`;
    tourTooltipContainer.appendChild(tourTooltipHeader);
  }

  _addTooltipContent(tourStep) {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipContentClass = 'tour-tooltip-content';
    let tourTooltipContent = tourTooltipContainer.querySelector('.tour-tooltip-content');
    let tourTooltipContentText = this._getTransaltedStringWithHtml(tourStep.text);

    if (typeof (TOUR_OPTIONS.TOOLTIP_CONTENT_CLASS) === 'string') {
      tooltipContentClass += ` ${TOUR_OPTIONS.TOOLTIP_CONTENT_CLASS}`;
    }
    if (tourTooltipContent == null) {
      tourTooltipContent = document.createElement('div');
    }
    tourTooltipContent.className = tooltipContentClass;
    tourTooltipContent.innerHTML = `<p>${tourTooltipContentText}</p>`;
    tourTooltipContainer.appendChild(tourTooltipContent);
  }

  _addTooltipFooter() {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipFooterClass = 'tour-tooltip-footer';
    let tooltipFooterLayer = tourTooltipContainer.querySelector('.tour-tooltip-footer');

    if (tooltipFooterLayer == null) {
      tooltipFooterLayer = document.createElement('div');
    }
    if (typeof (TOUR_OPTIONS.TOOLTIP_FOOTER_CLASS) === 'string') {
      tooltipFooterClass += ` ${TOUR_OPTIONS.TOOLTIP_FOOTER_CLASS}`;
    }
    // Add the layer to the container
    tooltipFooterLayer.className = tooltipFooterClass;
    tourTooltipContainer.appendChild(tooltipFooterLayer);
  }

  _addTourProgressLayer() {
    let self = this;
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipFooterLayer = tourTooltipContainer.querySelector('.tour-tooltip-footer');
    let tourProgressLayerClass = 'tour-progress';
    let tourProgressLayer = tooltipFooterLayer.querySelector('.tour-progress');
    let tourBulletsLayerClass = 'tour-bullets';
    let tourBulletsLayer = tooltipFooterLayer.querySelector('.tour-bullets');

    // Show progress as bullets or the progress bar
    if (TOUR_OPTIONS.SHOW_BULLETS === true) {
      if (typeof (TOUR_OPTIONS.TOUR_BULLETS_CLASS) === 'string') {
        tourBulletsLayerClass += ` ${TOUR_OPTIONS.TOUR_BULLETS_CLASS}`;
      }
      if (tourBulletsLayer == null) {
        tourBulletsLayer = document.createElement('div');
        tourBulletsLayer.appendChild(this._getProgressBarAsBullets(self, self._tourItems.length, self._currStepNo));
      } else {
        tourBulletsLayer.querySelector('li > a.active').className = '';
        tourBulletsLayer.querySelector(`li > a[step-number="${self._currStepNo}"]`).className = 'active';
      }
      tourBulletsLayer.className = tourBulletsLayerClass;
      tooltipFooterLayer.appendChild(tourBulletsLayer);

    } else if (TOUR_OPTIONS.SHOW_PROGRESS === true) {
      if (typeof (TOUR_OPTIONS.TOUR_PROGRESS_CLASS) === 'string') {
        tourProgressLayerClass += ` ${TOUR_OPTIONS.TOUR_PROGRESS_CLASS}`;
      }
      if (tourProgressLayer == null) {
        tourProgressLayer = document.createElement('div');
      }
      tourProgressLayer.className = tourProgressLayerClass;
      tooltipFooterLayer.appendChild(tourProgressLayer);
    }
  }

  _addNavigationLayer() {
    let self = this;
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipFooterLayer = tourTooltipContainer.querySelector('.tour-tooltip-footer');
    let tourButtonsLayerClass = 'tour-buttons';
    let tourButtonsLayer = tooltipFooterLayer.querySelector('.tour-buttons');
    let nextButton = tooltipFooterLayer.querySelector('.tour-next-button');

    if (typeof (TOUR_OPTIONS.TOUR_BUTTONS_CLASS) === 'string') {
      tourButtonsLayerClass += ` ${TOUR_OPTIONS.TOUR_BUTTONS_CLASS}`;
    }
    if (tourButtonsLayer == null) {
      tourButtonsLayer = document.createElement('div');
    }
    tourButtonsLayer.className = tourButtonsLayerClass;

    // Next button
    if (nextButton == null) {
      nextButton = document.createElement('a');
    }
    nextButton.onclick = function() {
      if (self._currStepNo != (self._tourItems.length - 1)) {
        self._nextStep();
      } else if (self._currStepNo == (self._tourItems.length - 1)) {
        self._exitTour();
      }
    };
    nextButton.href = 'javascript:void(0);';
    nextButton.className = 'tour-button tour-next-button';
    if (self._currStepNo == 0) {
      nextButton.innerHTML = this._getTranslatedString(`${TOUR_OPTIONS.START_LABEL}`);
    } else if (self._currStepNo == (self._tourItems.length - 1)) {
      nextButton.innerHTML = this._getTranslatedString(`${TOUR_OPTIONS.EXIT_LABEL}`);
    } else {
      nextButton.innerHTML = this._getTranslatedString(`${TOUR_OPTIONS.NEXT_LABEL}`);
    }

    // Add buttons to the layer
    tourButtonsLayer.appendChild(nextButton);
    // Add the layer to the container
    tooltipFooterLayer.appendChild(tourButtonsLayer);
  }

  _addTooltipArrow() {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipArrowClass = 'tour-tooltip-arrow';
    let tooltipArrow = tourTooltipContainer.querySelector('.tour-tooltip-arrow');

    if (typeof (TOUR_OPTIONS.TOOLTIP_ARROW_CLASS) === 'string') {
      tooltipArrowClass += ` ${TOUR_OPTIONS.TOOLTIP_ARROW_CLASS}`;
    }
    if (tooltipArrow == null) {
      tooltipArrow = document.createElement('div');
    }
    tooltipArrow.className = tooltipArrowClass;
    tourTooltipContainer.appendChild(tooltipArrow);
  }

  _repositionTooltip(tourStep) {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');
    let tooltipArrow = tourTooltipContainer.querySelector('.tour-tooltip-arrow');
    let tourTooltipNumberLayer = baseTourTooltipReferenceLayer.querySelector('.tour-helper-number-layer');
    let tourExitButtonLayer = baseTourTooltipReferenceLayer.querySelector('.tour-exit-button-layer');

	// Reset any margin, padding for the tooltip
    tourTooltipContainer.style.top = null;
    tourTooltipContainer.style.right = null;
    tourTooltipContainer.style.bottom = null;
    tourTooltipContainer.style.left = null;
    tourTooltipContainer.style.marginLeft = null;
    tourTooltipContainer.style.marginTop = null;
    // Arrow display should inherit its parent style
    tooltipArrow.style.display = 'inherit';
	// if not null then clear any styling of number layer
    if (typeof(tourTooltipNumberLayer) != 'undefined' && tourTooltipNumberLayer != null) {
      tourTooltipNumberLayer.style.top = null;
      tourTooltipNumberLayer.style.left = null;
    }
	// if not null then clear any styling of exit button layer
    if (typeof(tourExitButtonLayer) != 'undefined' && tourExitButtonLayer != null) {
      tourExitButtonLayer.style.top = null;
      tourExitButtonLayer.style.left = null;
    }
	// Return without placement if the current step is not defined
	// or the targetelement is null
    if (typeof(tourStep) === 'undefined' || tourStep == null) {
      return;
    }
	// Desired position of the tooltip
    let currentTooltipPosition = tourStep.position;
    let targetElement = tourStep.element;

    if (currentTooltipPosition == 'auto' && currentTooltipPosition != 'floating') {
      currentTooltipPosition = this._autoPosition(targetElement, tourTooltipContainer, currentTooltipPosition);
    }
    let targetElementPosition = this._getElementPosition(targetElement);
    let tooltipPosition = this._getElementPosition(tourTooltipContainer);
    let screenSize = this._getScreenDimensions();

    switch (currentTooltipPosition) {
      case 'top':
        tooltipArrow.className = 'tour-tooltip-arrow bottom';
        this._checkRight(targetElementPosition, 15, tooltipPosition, screenSize, tourTooltipContainer);
        tourTooltipContainer.style.bottom = `${(targetElementPosition.height + 20)}px`;
        break;
      case 'right':
        tourTooltipContainer.style.left = `${(targetElementPosition.width + 20)}px`;
        if (targetElementPosition.top + tooltipPosition.height > screenSize.height) {
          tooltipArrow.className = 'tour-tooltip-arrow left-bottom';
          tourTooltipContainer.style.top = `-${(tooltipPosition.height - targetElementPosition.height - 20)}px`;
        } else {
          tooltipArrow.className = 'tour-tooltip-arrow left';
        }
        break;
      case 'left':
        if (targetElementPosition.top + tooltipPosition.height > screenSize.height) {
          tourTooltipContainer.style.top = `-${(tooltipPosition.height - targetElementPosition.height - 20)}px`;
          tooltipArrow.classNAme = 'tour-tooltip-arrow right-bottom';
        } else {
          tooltipArrow.className = 'tour-tooltip-arrow right';
        }
        tourTooltipContainer.style.right = `${(targetElementPosition.width + 20)}px`;
        break;
      case 'floating':
        tooltipArrow.style.display = 'none';
        tourTooltipContainer.style.left = '50%';
        tourTooltipContainer.style.top = '50%';
        tourTooltipContainer.style.marginLeft = `-${(tooltipPosition.width / 2)}px`;
        tourTooltipContainer.style.marginTop = `-${(tooltipPosition.height / 2)}px`;
        if (typeof(tourTooltipNumberLayer) !== 'undefined' && tourTooltipNumberLayer != null) {
          tourTooltipNumberLayer.style.left = `-${((tooltipPosition.width / 2) + 18)}px`;
          tourTooltipNumberLayer.style.top = `-${((tooltipPosition.height / 2) + 18)}px`;
        }
        if (typeof(tourExitButtonLayer) !== 'undefined' && tourExitButtonLayer != null) {
          tourExitButtonLayer.style.left = `-${((tooltipPosition.width / 2) + 90)}px`;
          tourExitButtonLayer.style.top = `-${((tooltipPosition.height / 2) + 18)}px`;
        }
        break;
      case 'bottom-right-aligned':
        tooltipArrow.className = 'tour-tooltip-arrow top-right';
        this._checkLeft(targetElementPosition, 0, tooltipPosition, tourTooltipContainer);
        tourTooltipContainer.style.top = `${(targetElementPosition.height + 20)}px`;
        break;
      case 'bottom-middle-aligned':
        tooltipArrow.className = 'tour-tooltip-arrow top-middle';
        let tooltipLayerStyleLeftRight = targetElementPosition.width / 2 - targetElementPosition.width / 2;

        if (this._checkLeft(targetElementPosition, tooltipLayerStyleLeftRight, tooltipPosition, tourTooltipContainer)) {
          tourTooltipContainer.style.right = null;
          this._checkRight(targetElementPosition, tooltipLayerStyleLeftRight, tooltipPosition, screenSize, tourTooltipContainer);
        }
        tourTooltipContainer.style.top = `${(targetElementPosition.height + 20)}px`;
        break;
      case 'bottom-left-aligned':
      case 'bottom':
      default:
        tooltipArrow.className = 'tour-tooltip-arrow top';
        this._checkRight(targetElementPosition, 0, tooltipPosition, screenSize, tourTooltipContainer);
        tourTooltipContainer.style.top = `${(targetElementPosition.height + 2)}px`;
        break;
    }
  }

  _highlightTargetElement(tourStep) {
    let baseTourTooltipReferenceLayer = this._baseElement.querySelector('.tour-tooltip-reference-layer');
    let tourTooltipContainer = baseTourTooltipReferenceLayer.querySelector('.tour-tooltip');

    // Return without placement if the current step is not defined
    // or the targetelement is null
    if (typeof(tourStep) === 'undefined' || tourStep == null) {
      return;
    }
    let targetElement = tourStep.element;

    // Fix for IE
    if (!this._isHtmlTagNotNgElement(targetElement.tagName)) {
      let nextElement = targetElement.parentNode;

      if (nextElement != null && !this._isHtmlTagNotNgElement(nextElement.tagName)) {
        let targetElementChildren = targetElement.children;
        let childIndex = 0;

        nextElement = targetElementChildren[childIndex];
        while (nextElement.nodeType !== Node.ELEMENT_NODE) {
          childIndex = childIndex + 1;
          nextElement = targetElementChildren[childIndex];
        }
      }
      nextElement.className += ' tour-show-element';
      let nextElementPosition = this._getCssPropertyValue(nextElement, 'position');

      if (nextElementPosition !== 'absolute' &&
          nextElementPosition !== 'relative') {
        nextElement.className += ' tour-relative-position';
      }
    }
    // Add target element position style
    targetElement.className += ' tour-show-element';
    let currentElementPosition = this._getCssPropertyValue(targetElement, 'position');

    if (currentElementPosition !== 'absolute' &&
        currentElementPosition !== 'relative') {
      targetElement.className += ' tour-relative-position';
    }

    let elementPosition = this._getElementPosition(targetElement);
    let tooltipPosition = this._getElementPosition(tourTooltipContainer);

    if (!this._isElementInViewport(elementPosition, tooltipPosition, tourStep.position) && TOUR_OPTIONS.SCROLL_TO_ELEMENT === true) {
      let winHeight = this._getScreenDimensions().height;
      let bottom = (elementPosition.top + elementPosition.height) - winHeight;

      switch (tourStep.position) {
        case 'top' :
          window.scrollBy(0, bottom + 100);
          break;
        case 'bottom' :
        default :
          window.scrollBy(0, bottom + tooltipPosition.height + 100);
          break;
      }
    }
    return;
  }

  /**
   * Check if the tooltip can be displayed in the right side of the element.
   * true if the space in the can fit the tooltip or else false.
   * @method _checkRight
   * @param {Object} targetElementPosition
   * @param {number} tooltipLayerStyleLeft
   * @param {Object} tooltipPosition
   * @param {Object} screenSize
   * @param {Object} tooltipContainer
   * @returns {boolean} true or false
   */
  _checkRight(targetElementPosition, tooltipLayerStyleLeft, tooltipPosition, screenSize, tooltipContainer) {
    if (targetElementPosition.left + tooltipLayerStyleLeft + tooltipPosition.width > screenSize.width) {
      tooltipContainer.style.left = `${(screenSize.width - tooltipPosition.width - targetElementPosition.left)}px`;
      return false;
    }
    tooltipContainer.style.left = `${tooltipLayerStyleLeft}px`;
    return true;
  }

  /**
   * Check if the tooltip can be displayed in the left side of the element
   * True if the space in the left can fit the tooltip or else false.
   * @method _checkLeft
   * @param {Object} targetElementPosition
   * @param {number} tooltipLayerStyleRight
   * @param {Object} tooltipPosition
   * @param {Object} tooltipContainer
   * @returns {boolean} true or false
   */
  _checkLeft(targetElementPosition, tooltipLayerStyleRight, tooltipPosition, tooltipContainer) {
    if (targetElementPosition.left + targetElementPosition.width - tooltipLayerStyleRight - tooltipPosition.width < 0) {
      tooltipContainer.style.left = `${(-targetElementPosition.left)}px`;
      return false;
    }
    tooltipContainer.style.right = `${tooltipLayerStyleRight}px`;
    return true;
  }
  /**
   * Disable interaction
   * @method _disableInteraction
   * @param {HTMLElement} targetElement
   * @returns {void} no return type
   */
  _disableInteraction(targetElement) {
    let disableInteractionLayer = document.querySelector('.tour-disable-interaction');

    if (typeof (disableInteractionLayer) === 'undefined' || disableInteractionLayer === null) {
      disableInteractionLayer = document.createElement('div');
      disableInteractionLayer.className = 'tour-disable-interaction';
      targetElement.appendChild(disableInteractionLayer);
    }
    this._setLayerPosition(disableInteractionLayer);
  }

  /**
   * Get the progress bar
   * @method _getProgressBar
   * @returns {HTMLElement} Progress bar
   */
  _getProgressBar() {
    let progressBar = document.createElement('div');

    progressBar.className = 'tour-progressbar';
    progressBar.setAttribute('style', `width:${this._getProgress()}%;`);
    return progressBar;
  }

  /**
   * Get the progress bar in bullet form
   * @method _getProgressBarAsBullets
   * @param {Object} self
   * @param {number} stepsLength length of the steps
   * @param {number} stepNo step number
   * @returns {HTMLElement} Progress bar with bullets
   */
  _getProgressBarAsBullets(self, stepsLength, stepNo) {
    let ulContainer = document.createElement('ul');

    for (let i = 0; i < stepsLength; i++) {
      let innerLI = document.createElement('li');
      let anchorLink = document.createElement('a');

      anchorLink.onClick = function() {
        self._goToStep(this.getAttribute('step-number'));
      };
      if (i === stepNo) {
        anchorLink.className = 'active';
      }
      anchorLink.href = 'javascript:void(0);';
      anchorLink.innerHTML = '&nbsp;';
      anchorLink.setAttribute('step-number', i);
      innerLI.appendChild(anchorLink);
      ulContainer.appendChild(innerLI);
    }
    return ulContainer;
  }

  /**
   * Get an element CSS property of the page
   * @method _getCssPropertyValue
   * @param {HTMLElement} element
   * @param {String} propertyName
   * @returns {String} Element's property value
   */
  _getCssPropertyValue(element, propertyName) {
    let propValue = '';

    if (element.currentStyle) { // IE
      propValue = element.currentStyle[propertyName];
    } else if (document.defaultView && document.defaultView.getComputedStyle) { // Firefox
      propValue = document.defaultView.getComputedStyle(element, null).getPropertyValue(propertyName);
    } else {
      propValue = element.style[propertyName];
    }

    // Prevent exception in IE
    if (propValue && propValue.toLowerCase) {
      return propValue.toLowerCase();
    } else {
      return propValue;
    }
  }

  /**
   * Checks if the provided element is fixed or not
   * @method _isFixedElement
   * @param {HTMLElement} element
   * @returns {boolean} yes or no
   */
  _isFixedElement(element) {
    let p = element.parentNode;

    if (p.nodeName === 'HTML') {
      return false;
    }
    if (this._getCssPropertyValue(element, 'position') == 'fixed') {
      return true;
    }
    return this._isFixedElement(p);
  }

  /**
   * Returns the screen dimensions
   * @method _getScreenDimensions
   * @returns {Object} width and height of the screen
   */
  _getScreenDimensions() {
    if (window.innerWidth != undefined) {
      return {width: window.innerWidth, height: window.innerHeight};
    } else {
      let D = document.documentElement;

      return {width: D.clientWidth, height: D.clientHeight};
    }
  }

  /**
   * Check if the element is in the viewport
   * http://stackoverflow.com/a/7557433/94197
   * @method _isElementInViewport
   * @param {Object} elementPosition
   * @param {Object} tooltipElementPosition
   * @param {string} tooltipPosition
   * @returns {boolean} true or false
   */
  _isElementInViewport(elementPosition, tooltipElementPosition, tooltipPosition) {
    let retValue = false;

    switch (tooltipPosition) {
      case 'top':
        retValue = tooltipElementPosition.top >= 0 && elementPosition.left >= 0 && ((elementPosition.top + elementPosition.height) <= (window.innerHeight || document.documentElement.clientHeight)) && ((elementPosition.left + elementPosition.width) <= (window.innerWidth || document.documentElement.clientWidth));
        break;
      case 'bottom':
      default:
        retValue = elementPosition.top >= 0 && elementPosition.left >= 0 && ((elementPosition.top + elementPosition.height + 10 + tooltipElementPosition.height) <= (window.innerHeight || document.documentElement.clientHeight)) && ((elementPosition.left + elementPosition.width) <= (window.innerWidth || document.documentElement.clientWidth));
        break;
    }
    return retValue;
  }

  /**
   * Get the element position on the page, body bounding rectangle and
   * element bounding rectangle.
   * @method _getDocumentBoundingRec
   * @param {HTMLElement} element
   * @return {void} no return
   */
  _getDocumentBoundingRec(element) {
    this._bodyRect = document.body.getBoundingClientRect();
    this._elemRect = element.getBoundingClientRect();
    this._offsetTop = this._elemRect.top - this._bodyRect.top;
    this._offsetLeft = this._elemRect.left - this._bodyRect.left;
  }

  /**
   * Determines the position of the tooltip based on the position precedence and availability
   * of screen space.
   * @method _autoPosition
   * @param {HTMLElement} targetElement
   * @param {HTMLElement} tooltipLayer
   * @param {Object} desiredTooltipPosition
   * @returns {Object} auto calculated position of the tooltip with respect to the target element
   */
  _autoPosition(targetElement, tooltipLayer, desiredTooltipPosition) {
    // Take a clone of position precedence. These will be the available
    let possiblePositions = ['bottom', 'top', 'right', 'left'];
    let screenSize = this._getScreenDimensions();
    let tooltipHeight = this._getElementPosition(tooltipLayer).height + 10;
    let tooltipWidth = this._getElementPosition(tooltipLayer).width + 20;
    let targetOffset = this._getElementPosition(targetElement);
    let calculatedPosition = 'floating';

    // Check if the width of the tooltip + the starting point would
    // spill off the right side of the screen
    // If no, neither bottom or top are valid
    if (targetOffset.left + tooltipWidth > screenSize.width || ((targetOffset.left + (targetOffset.width / 2)) - tooltipWidth) < 0) {
      without(possiblePositions, 'bottom');
      without(possiblePositions, 'top');
    } else {
      // Check for space below
      if ((targetOffset.height + targetOffset.top + tooltipHeight) > screenSize.height) {
        without(possiblePositions, 'bottom');
      }
      // Check for space above
      if (targetOffset.top - tooltipHeight < 0) {
        without(possiblePositions, 'top');
      }
    }
    // Check for space to the right
    if (targetOffset.width + targetOffset.left + tooltipWidth > screenSize.width) {
      without(possiblePositions, 'right');
    }
    // Check for space to the left
    if (targetOffset.left - tooltipWidth < 0) {
      without(possiblePositions, 'left');
    }
    // At this point, our array only has positions that are valid. Pick the first one, as it remains in order
    if (possiblePositions.length > 0) {
      calculatedPosition = possiblePositions[0];
    }
    // If the requested position is in the list, replace our calculated choice with that
    if (desiredTooltipPosition && desiredTooltipPosition != 'auto') {
      if (possiblePositions.indexOf(desiredTooltipPosition) > -1) {
        calculatedPosition = desiredTooltipPosition;
      }
    }
    return calculatedPosition;
  }

  /**
   * Get the element position on the page
   * @method _getElementPosition
   * @param {HTMLElement} element
   * @returns {Object} Element's position - the top left coordinate.
   */
  _getElementPosition(element) {
    let _x = 0;
    let _y = 0;
    let elementPosition = {};
    let firstChildNode = null;

    // Set width
    elementPosition.width = element.offsetWidth;
    // Set height
    elementPosition.height = element.offsetHeight;
    if (!this._isHtmlTagNotNgElement(element.tagName) && element.hasChildNodes()) {
      let children = element.childNodes;

      for (let i = 0; i < children.length; i++) {
        if (this._isHtmlTagNotNgElement(children[i].tagName)) {
          firstChildNode = children[i];
          break;
        }
      }
    }
    if (!this._isHtmlTagNotNgElement(element.tagName.toUpperCase()) && firstChildNode != null) {
      // If element width found was 0 then check from the childs
      elementPosition.width = firstChildNode.offsetWidth;
      // If element height found was 0 then check the first child height
      elementPosition.height = firstChildNode.offsetHeight;
      element = firstChildNode;
    }
    while (element) {
      _y += element.offsetTop || 0;
      _x += element.offsetLeft || 0;
      element = element.offsetParent;
    }

    // set top and left coordinate
    elementPosition.top = _y;
    elementPosition.left = _x;
    return elementPosition;
  }

  /**
   * Update the position of the helper layer on the page
   * @method _setHelperLayerPosition
   * @param {Object} tourStep Configuration of the current tour step
   * @param {HTMLElement} layer
   * @return {void} no return
   */
  _setLayerPosition(tourStep, layer) {
    if (layer) {
      if (tourStep != null) {
        let elementPosition = this._getElementPosition(tourStep.element);
        let padding = 10;

        // If the target element postion is fixed, then the tooltip
        // position should be fixed as well
        if (this._isFixedElement(tourStep.element)) {
          layer.className += ' tour-fixed-tooltip';
        }
        if (tourStep.position == 'floating') {
          padding = 0;
        }
        layer.setAttribute('style', `width:${(elementPosition.width + padding)}px;height:${(elementPosition.height + padding)}px;top:${(elementPosition.top - 5)}px;left:${(elementPosition.left - 5)}px;`);
      }
    }
  }

  /**
   * Gets the current progress in percentage
   * @method _getProgress
   * @returns {number} current progress in percentage
   */
  _getProgress() {
    let currentStep = parseInt(this._currStepNo, 10);

    return ((currentStep / this._tourItems.length) * 100);
  }

  /**
   * Has the tour reach to end
   * @returns {boolean} return true if the tour has reached the last step.
   */
  _hasReachedEnd() {
    let currentStep = parseInt(this._currStepNo, 10);

    return (currentStep === (this._tourItems.length - 1));
  }

  /**
   * Search for an element in the document for a provided selector and selector type.
   * @method _findElement
   * @param {String} selectorType type of the selector
   * @param {String} selector - JQLite selector element
   * @returns {HTMLElement} Return the searched element from the page
   */
  _findElement(selectorType, selector) {
    let ele = undefined;

    switch (selectorType) {
      case 'id' : ele = document.getElementById(selector); break;
      case 'ui-sref' : ele = document.querySelector(`a[ui-sref="${selector}"]`); break;
      default: ele = document.querySelector(selector); break;
    }
    return ele;
  }

  _getTranslatedString(msgKey: string): string {
    return this.$filter('translate')(`${msgKey}`);
  }

  _getTransaltedStringWithHtml(msgKey: string): string {
    let translatedMsg = this._getTranslatedString(msgKey);
    let trustedHtml = this.$sce.getTrustedHtml(this.$sce.trustAsHtml(translatedMsg));

    return trustedHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  // returns true if it is a DOM element
  _isHtmlTagNotNgElement(tagName) {
    return tagName === 'TEXTAREA' || tagName === 'DIV' || tagName === 'IMG' || tagName === 'VIDEO' || tagName === 'BODY' || tagName === 'CANVAS' || tagName === 'TABLE';
  }
}

HelpTourController.$inject = [
  'UserService',
  '$location',
  '$timeout',
  '$scope',
  '$filter',
  '$sce',
  '$sanitize'
];

export default HelpTourController;
