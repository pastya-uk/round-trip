/* @flow */
export type HelpTourConfigItem = {
  selector?: string;
  selectorType?: string;
  heading?: string;
  text?: string;
  position?: string;
  overlayClass?: string;
  elementTemplate?: string;
  buttonTemplate?: string;
  onPreviousFn?: Function;
  onNextFn?: Function;
  onSkipFn?: Function;
  onExitFn?: Function;
  onExploreFn?: Function;
  element?: Object;
};

export const TOUR_STEPS_CONFIG: {[key: string]: HelpTourConfigItem} = {
  INTRODUCTION: {
    heading: 'tourHeaders.introduction',
    text: 'tourText.introduction'
  },
  SIDEBAR_DASHBORAD: {
    selector: 'demica.dashboard',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarDashboard',
    text: 'tourText.sidebarDashboard',
    position: 'right'
  },
  SIDEBAR_CASHFLOW: {
    selector: 'demica.cashflow',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarCashflow',
    text: 'tourText.sidebarCashflow',
    position: 'right'
  },
  SIDEBAR_UPLOAD_QUEUE: {
    selector: 'demica.ledgerUploads',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarUploadQueue',
    text: 'tourText.sidebarUploadQueue',
    position: 'right'
  },
  SIDEBAR_FUNDING_REQUESTS: {
    selector: 'demica.funding-requests',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarFundingRequests',
    text: 'tourText.sidebarFundingRequests',
    position: 'right'
  },
  SIDEBAR_INVOICES: {
    selector: 'demica.invoices',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarInvoices',
    text: 'tourText.sidebarInvoices',
    position: 'right'
  },
  SIDEBAR_CREDIT_NOTES: {
    selector: 'demica.credit-notes',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarCreditNotes',
    text: 'tourText.sidebarCreditNotes',
    position: 'right'
  },
  SIDEBAR_PAYMENT_NOTIFICATION: {
    selector: 'demica.payment-notifications',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarPmntNotif',
    text: 'tourText.sidebarPmntNotif',
    position: 'right'
  },
  SIDEBAR_REPORTS: {
    selector: 'demica.reports',
    selectorType: 'ui-sref',
    heading: 'tourHeaders.sidebarReports',
    text: 'tourText.sidebarReports',
    position: 'right'
  },
  PAYMENT_DUE_WIDGET: {
    selector: 'payments-due-widget',
    selectorType: 'tagname',
    heading: 'tourHeaders.paymentDueWidget',
    text: 'tourText.paymentDueWidget',
    position: 'bottom'
  },
  CASHFLOW_SUPPLIER_WIDGET: {
    selector: 'cashflow-widget',
    selectorType: 'tagname',
    heading: 'tourHeaders.supplierCashflowWidget',
    text: 'tourText.supplierCashflowWidget',
    position: 'bottom'
  },
  AUTOTRADE: {
    selector: 'auto-trade-widget',
    selectorType: 'tagname',
    heading: 'tourHeaders.autoTradeWidget',
    text: 'tourText.autoTradeWidget',
    position: 'bottom'
  },
  INVOICES_SUPPLIER_WIDGET: {
    selector: 'outstanding-summary-widget',
    selectorType: 'tagname',
    heading: 'tourHeaders.supplierOutstandingWidget',
    text: 'tourText.supplierOutstandingWidget',
    position: 'bottom'
  },
  RANKED_ENTITIES: {
    selector: 'ranked-entities',
    selectorType: 'tagname',
    heading: 'tourHeaders.supplierRankedEntities',
    text: 'tourText.supplierRankedEntities',
    position: 'top'
  },
  ALERTS: {
    selector: 'alerts-widget',
    selectorType: 'tagname',
    heading: 'tourHeaders.alertsWidget',
    text: 'tourText.alertsWidget',
    position: 'top'
  }
};

export const TOUR_OPTIONS = {
  NEXT_LABEL: 'NEXT_STEP',
  PREV_LABEL: 'PREVIOUS_STEP',
  SKIP_LABEL: 'Skip',
  START_LABEL: 'START',
  EXIT_LABEL: 'EXIT',
  TOOLTIP_CLASS: 'row',
  TOOLTIP_HEADER_CLASS: 'row',
  TOOLTIP_FOOTER_CLASS: 'row',
  TOOLTIP_CONTENT_CLASS: 'row',
  OVERLAY_CLASS: '',
  HIGHLIGHT_CLASS: '',
  TOUR_PROGRESS_CLASS: 'col-xs-8',
  TOUR_BULLETS_CLASS: 'col-xs-8',
  TOUR_BUTTONS_CLASS: 'col-xs-4',
  EXIT_ON_ESC: true,
  EXIT_ON_OVERLAY_CLICK: true,
  SHOW_STEP_NUMBERS: false,
  KEYBOARD_NAVIGATION: true,
  SHOW_BULLETS: true,
  SHOW_PROGRESS: true,
  SCROLL_TO_ELEMENT: true,
  OVERLAY_OPACITY: 0.8,
  POSITION_PRECEDENCE: ['bottom', 'top', 'right', 'left'],
  DISABLE_INTERACTION: false
};

export const TOUR_CONFIG = {
  Buyer: {
    '#': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ],
    'invoices': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ],
    'dashboard': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ]
  },
  Supplier: {
    '#': [
      TOUR_STEPS_CONFIG.INTRODUCTION,
      TOUR_STEPS_CONFIG.PAYMENT_DUE_WIDGET,
      TOUR_STEPS_CONFIG.CASHFLOW_SUPPLIER_WIDGET,
      TOUR_STEPS_CONFIG.AUTOTRADE,
      TOUR_STEPS_CONFIG.INVOICES_SUPPLIER_WIDGET,
      TOUR_STEPS_CONFIG.RANKED_ENTITIES,
      TOUR_STEPS_CONFIG.ALERTS
    ],
    'invoices': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ],
    'dashboard': [
      TOUR_STEPS_CONFIG.INTRODUCTION,
      TOUR_STEPS_CONFIG.PAYMENT_DUE_WIDGET,
      TOUR_STEPS_CONFIG.CASHFLOW_SUPPLIER_WIDGET,
      TOUR_STEPS_CONFIG.AUTOTRADE,
      TOUR_STEPS_CONFIG.INVOICES_SUPPLIER_WIDGET,
      TOUR_STEPS_CONFIG.RANKED_ENTITIES,
      TOUR_STEPS_CONFIG.ALERTS
    ]
  },
  Financr: {
    '#': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ],
    'invoices': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ],
    'dashboard': [
      TOUR_STEPS_CONFIG.INTRODUCTION
    ]
  },
  SysAdmin: {
    '#': [
      TOUR_STEPS_CONFIG.INTRODUCTION,
      TOUR_STEPS_CONFIG.PAYMENT_DUE_WIDGET
    ],
    '#invoices': [
      TOUR_STEPS_CONFIG.INTRODUCTION,
      TOUR_STEPS_CONFIG.PAYMENT_DUE_WIDGET
    ],
    '#dashboard': [
      TOUR_STEPS_CONFIG.INTRODUCTION,
      TOUR_STEPS_CONFIG.PAYMENT_DUE_WIDGET
    ]
  }
};
