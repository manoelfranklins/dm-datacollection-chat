sap.ui.define([
	"sap/dm/dme/podfoundation/component/production/ProductionUIComponent",
	"sap/ui/Device"
], function (ProductionUIComponent, Device) {
	"use strict";

	/**
	 * Data Collection Chart Extension Component
	 * 
	 * This component extends the Data Collection List plugin to display
	 * data collection parameter values as interactive charts instead of rows.
	 * 
	 * Features:
	 * - Line, Column, Scatter, and Combination chart types
	 * - Automatic data refresh on parameter selection
	 * - Specification reference lines (upper/lower limits, target)
	 * - Statistics panel (min, max, avg, count)
	 * - CSV export functionality
	 * - Real-time updates via EventBus subscription
	 */
	return ProductionUIComponent.extend("sap.dm.custom.plugin.dcchartext.dcchartext.Component", {
		metadata: {
			manifest: "json"
		},

		/**
		 * Initialize the component
		 */
		init: function () {
			// Call parent init
			ProductionUIComponent.prototype.init.apply(this, arguments);
		},

		/**
		 * Component destruction - cleanup
		 */
		destroy: function () {
			// Call parent destroy
			ProductionUIComponent.prototype.destroy.apply(this, arguments);
		}
	});
});