sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/dm/dme/podfoundation/control/PropertyEditor"
], function (ResourceModel, PropertyEditor) {
    "use strict";
    
    var oFormContainer;

    return PropertyEditor.extend("sap.dm.custom.plugin.dcchartext.dcchartext.builder.PropertyEditor", {

        constructor: function (sId, mSettings) {
            PropertyEditor.apply(this, arguments);
            
            this.setI18nKeyPrefix("customComponentListConfig.");
            this.setResourceBundleName("sap.dm.custom.plugin.dcchartext.dcchartext.i18n.builder");
            this.setPluginResourceBundleName("sap.dm.custom.plugin.dcchartext.dcchartext.i18n.i18n");
        },
        
        addPropertyEditorContent: function (oPropertyFormContainer) {
            var oData = this.getPropertyData();
            
            // Navigation buttons
            this.addSwitch(oPropertyFormContainer, "backButtonVisible", oData);
            this.addSwitch(oPropertyFormContainer, "closeButtonVisible", oData);
            
            // Title
            this.addInputField(oPropertyFormContainer, "title", oData);
            
            // Chart settings
            this._addChartTypeSelect(oPropertyFormContainer, oData);
            
            // Feature toggles
            this.addSwitch(oPropertyFormContainer, "showStatistics", oData);
            this.addSwitch(oPropertyFormContainer, "showExportButton", oData);
            this.addSwitch(oPropertyFormContainer, "autoRefresh", oData);
            this.addSwitch(oPropertyFormContainer, "showReferenceLines", oData);

            oFormContainer = oPropertyFormContainer;
        },
        
        /**
         * Add chart type selection dropdown
         */
        _addChartTypeSelect: function (oPropertyFormContainer, oData) {
            var oSelect = new sap.m.Select({
                selectedKey: oData.defaultChartType || "line",
                items: [
                    new sap.ui.core.Item({ key: "line", text: "Line Chart" }),
                    new sap.ui.core.Item({ key: "column", text: "Column Chart" }),
                    new sap.ui.core.Item({ key: "scatter", text: "Scatter Plot" }),
                    new sap.ui.core.Item({ key: "combination", text: "Combination" })
                ],
                change: function (oEvent) {
                    oData.defaultChartType = oEvent.getParameter("selectedItem").getKey();
                }
            });
            
            this.addFormInputToPropertyPanel(oPropertyFormContainer, "defaultChartType", oSelect, oData);
        },
        
        getDefaultPropertyData: function () {
            return {
                // Navigation
                "backButtonVisible": false,
                "closeButtonVisible": true,
                
                // Title
                "title": "Data Collection Chart",
                
                // Chart Settings
                "defaultChartType": "line",
                
                // Feature Toggles
                "showStatistics": true,
                "showExportButton": true,
                "autoRefresh": true,
                "showReferenceLines": true
            };
        }

    });
});