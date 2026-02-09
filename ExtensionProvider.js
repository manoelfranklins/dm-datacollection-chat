sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/mvc/OverrideExecution"
], function (ControllerExtension, OverrideExecution) {
    "use strict";

    // Controller Extension for Data Collection List Plugin
    var DCChartControllerExtension = ControllerExtension.extend("sap.dm.custom.plugin.dcchartext.dcchartext.DCChartControllerExtension", {
        
        metadata: {
            methods: {
                "onInit": {"public": true, "final": false, overrideExecution: OverrideExecution.After},
                "onAfterRendering": {"public": true, "final": false, overrideExecution: OverrideExecution.After}
            }
        },

        override: {
            onInit: function () {
                console.log("DC Chart Extension: onInit");
                // Subscribe to EventBus for parameter selection events
                this._subscribeToEvents();
            },
            
            onAfterRendering: function () {
                console.log("DC Chart Extension: onAfterRendering");
                // Add chart button to plugin header
                this._addChartButtonToHeader();
                // Also try to intercept popover rendering
                this._setupPopoverObserver();
            }
        },

        _subscribeToEvents: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            // Subscribe to various possible events
            oEventBus.subscribe("sap.dm.dme", "dcParameterSelected", this._onParameterSelected, this);
            oEventBus.subscribe("dataCollection", "parameterSelected", this._onParameterSelected, this);
            console.log("DC Chart Extension: Subscribed to events");
        },

        _onParameterSelected: function (sChannel, sEvent, oData) {
            console.log("DC Chart Extension: Parameter selected event", oData);
            this._showChartForParameter(oData);
        },

        _addChartButtonToHeader: function () {
            try {
                if (this._headerButtonAdded) return;
                
                var oView = this.base.getView();
                if (!oView || !oView.getDomRef()) return;
                
                var that = this;
                var oDomRef = oView.getDomRef();
                var oToolbar = oDomRef.querySelector(".sapMTB");
                
                if (oToolbar) {
                    sap.ui.require(["sap/m/Button"], function(Button) {
                        var oBtn = new Button({
                            icon: "sap-icon://line-chart",
                            tooltip: "Show Data Collection Chart",
                            type: "Transparent",
                            press: function() { that._showChartDialog(); }
                        });
                        var oDiv = document.createElement("div");
                        oDiv.style.cssText = "display:inline-block;margin-right:8px;";
                        oToolbar.appendChild(oDiv);
                        oBtn.placeAt(oDiv);
                        that._headerButtonAdded = true;
                        console.log("DC Chart Extension: Header button added");
                    });
                }
            } catch (e) {
                console.error("DC Chart Extension error:", e);
            }
        },

        _setupPopoverObserver: function () {
            // Use MutationObserver to detect when popover/dialog opens
            var that = this;
            
            if (this._observer) return;
            
            this._observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) {
                            // Check for popover or dialog containing "Parameters"
                            var text = node.textContent || "";
                            if (text.indexOf("Parameters") > -1 || 
                                node.classList.contains("sapMPopover") ||
                                node.classList.contains("sapMDialog")) {
                                console.log("DC Chart Extension: Popover/Dialog detected");
                                setTimeout(function() {
                                    that._addChartButtonToPopover(node);
                                }, 500);
                            }
                        }
                    });
                });
            });
            
            this._observer.observe(document.body, { childList: true, subtree: true });
            console.log("DC Chart Extension: Popover observer set up");
        },

        _addChartButtonToPopover: function (oPopoverDom) {
            try {
                // Find toolbar or header in popover
                var oToolbar = oPopoverDom.querySelector(".sapMTB") || 
                              oPopoverDom.querySelector(".sapMBarMiddle") ||
                              oPopoverDom.querySelector(".sapMDialogTitle");
                
                if (oToolbar && !oPopoverDom.querySelector("#dcChartBtn")) {
                    var that = this;
                    sap.ui.require(["sap/m/Button"], function(Button) {
                        var oBtn = new Button("dcChartBtn", {
                            icon: "sap-icon://line-chart",
                            tooltip: "Show Chart",
                            type: "Transparent",
                            press: function() { that._showChartDialog(); }
                        });
                        var oDiv = document.createElement("div");
                        oDiv.id = "dcChartBtnContainer";
                        oDiv.style.cssText = "display:inline-block;margin-left:8px;";
                        
                        // Try to insert near "Parameters" text
                        var oParent = oToolbar.parentNode;
                        if (oParent) {
                            oParent.appendChild(oDiv);
                            oBtn.placeAt(oDiv);
                            console.log("DC Chart Extension: Button added to popover");
                        }
                    });
                }
            } catch (e) {
                console.error("DC Chart Extension popover error:", e);
            }
        },

        _showChartDialog: function () {
            var that = this;
            sap.ui.require([
                "sap/m/Dialog", "sap/m/Button", "sap/m/VBox", "sap/m/Text", "sap/m/Select",
                "sap/ui/core/Item", "sap/ui/model/json/JSONModel", "sap/viz/ui5/controls/VizFrame",
                "sap/viz/ui5/data/FlattenedDataset", "sap/viz/ui5/controls/common/feeds/FeedItem"
            ], function(Dialog, Button, VBox, Text, Select, Item, JSONModel, VizFrame, FlattenedDataset, FeedItem) {
                
                var oModel = new JSONModel({
                    dataPoints: [
                        { DateTime: "Reading 1", Value: 10 },
                        { DateTime: "Reading 2", Value: 25 },
                        { DateTime: "Reading 3", Value: 18 },
                        { DateTime: "Reading 4", Value: 30 },
                        { DateTime: "Reading 5", Value: 22 }
                    ]
                });

                var oVizFrame = new VizFrame({
                    width: "100%",
                    height: "350px",
                    vizType: "line",
                    dataset: new FlattenedDataset({
                        data: "{chartModel>/dataPoints}",
                        dimensions: [{ name: "DateTime", value: "{chartModel>DateTime}" }],
                        measures: [{ name: "Value", value: "{chartModel>Value}" }]
                    }),
                    feeds: [
                        new FeedItem({ uid: "valueAxis", type: "Measure", values: ["Value"] }),
                        new FeedItem({ uid: "categoryAxis", type: "Dimension", values: ["DateTime"] })
                    ]
                });
                oVizFrame.setModel(oModel, "chartModel");
                oVizFrame.setVizProperties({
                    plotArea: { dataLabel: { visible: true }, colorPalette: ["#5899DA"] },
                    valueAxis: { title: { visible: true, text: "Value" } },
                    categoryAxis: { title: { visible: true, text: "Reading" } },
                    title: { visible: true, text: "Data Collection Parameter Values" }
                });

                var oDialog = new Dialog({
                    title: "Data Collection Chart",
                    contentWidth: "700px",
                    contentHeight: "450px",
                    content: [
                        new VBox({
                            items: [
                                new Text({ text: "Parameter values over time" }).addStyleClass("sapUiSmallMarginBottom"),
                                oVizFrame
                            ]
                        }).addStyleClass("sapUiSmallMargin")
                    ],
                    endButton: new Button({ text: "Close", press: function() { oDialog.close(); }})
                });
                oDialog.open();
            });
        },

        _showChartForParameter: function (oData) {
            // Show chart with actual parameter data
            this._showChartDialog();
        }
    });

    // Extension Provider
    var ExtensionProvider = function () {
        console.log("DC Chart ExtensionProvider: Constructor");
    };

    ExtensionProvider.prototype.getExtensions = function () {
        console.log("DC Chart ExtensionProvider: getExtensions");
        return {
            "sap.dm.dme.dcplugins.dataCollectionListPlugin": {
                controllerExtension: DCChartControllerExtension
            }
        };
    };

    return ExtensionProvider;
});