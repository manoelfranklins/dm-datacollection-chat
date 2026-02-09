sap.ui.define([
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/controls/VizFrame",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem"
], function (PluginViewController, JSONModel, VizFrame, FlattenedDataset, FeedItem) {
    "use strict";

    return PluginViewController.extend("sap.dm.custom.plugin.dcchartext.dcchartext.controller.MainView", {

        onInit: function () {
            if (PluginViewController.prototype.onInit) {
                PluginViewController.prototype.onInit.apply(this, arguments);
            }
            
            // Initialize chart model
            this._oChartModel = new JSONModel({
                dataPoints: [],
                parameterName: "Select an SFC/Operation",
                hasData: false,
                loading: false
            });
            this.getView().setModel(this._oChartModel, "chartModel");
            
            // Subscribe to data collection events
            this._subscribeToEvents();
        },

        onBeforeRenderingPlugin: function () {
            // Called before plugin renders
        },

        onAfterRendering: function () {
            // Initialize chart after rendering
            this._initChart();
            // Try to load data from current selection, otherwise show sample
            this._loadFromCurrentSelection();
        },

        onExit: function () {
            this._unsubscribeFromEvents();
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
        },

        _subscribeToEvents: function () {
            // Subscribe to POD events
            this.subscribe("PodSelectionChangeEvent", this._onSelectionChange, this);
            this.subscribe("OperationListSelectEvent", this._onOperationSelected, this);
            this.subscribe("WorklistSelectEvent", this._onWorklistSelect, this);
            this.subscribe("OperationChangeEvent", this._onOperationSelected, this);
            
            console.log("DC Chart Plugin: Subscribed to events");
        },

        _unsubscribeFromEvents: function () {
            this.unsubscribe("PodSelectionChangeEvent", this._onSelectionChange, this);
            this.unsubscribe("OperationListSelectEvent", this._onOperationSelected, this);
            this.unsubscribe("WorklistSelectEvent", this._onWorklistSelect, this);
            this.unsubscribe("OperationChangeEvent", this._onOperationSelected, this);
        },

        _onSelectionChange: function (oEvent) {
            console.log("DC Chart Plugin: Selection changed", oEvent);
            this._loadFromCurrentSelection();
        },

        _onWorklistSelect: function (oEvent) {
            console.log("DC Chart Plugin: Worklist selected", oEvent);
            this._loadFromCurrentSelection();
        },

        _onOperationSelected: function (oEvent) {
            console.log("DC Chart Plugin: Operation selected", oEvent);
            this._loadFromCurrentSelection();
        },

        _initChart: function () {
            var oVizFrame = this.byId("dcVizFrame");
            if (oVizFrame) {
                oVizFrame.setVizProperties({
                    plotArea: {
                        dataLabel: { visible: true },
                        colorPalette: ["#5899DA", "#E8743B", "#19A979", "#ED4A7B", "#945ECF", "#13A4B4"],
                        line: {
                            visible: true,
                            width: 2
                        },
                        marker: {
                            visible: true,
                            size: 6
                        }
                    },
                    valueAxis: {
                        title: { visible: true, text: "Value" }
                    },
                    categoryAxis: {
                        title: { visible: true, text: "Date Created" }
                    },
                    title: {
                        visible: true,
                        text: "Data Collection Values"
                    },
                    legend: { 
                        visible: true,
                        title: { visible: true, text: "Parameters" }
                    },
                    interaction: {
                        selectability: {
                            mode: "EXCLUSIVE"
                        }
                    }
                });
                console.log("DC Chart Plugin: Chart initialized");
            }
        },

        _loadFromCurrentSelection: function () {
            try {
                var oPodSelectionModel = this.getPodSelectionModel();
                if (!oPodSelectionModel) {
                    console.log("DC Chart Plugin: No pod selection model");
                    this._showSampleData();
                    return;
                }
                
                var oSelection = oPodSelectionModel.getSelection();
                console.log("DC Chart Plugin: Current selection", oSelection);
                
                var sSfc = null;
                var sOperation = null;
                
                // Extract SFC string - handle various formats
                if (oSelection) {
                    if (oSelection.sfc && typeof oSelection.sfc === "object" && oSelection.sfc.sfc) {
                        sSfc = oSelection.sfc.sfc;
                    } else if (oSelection.sfc && typeof oSelection.sfc === "string") {
                        sSfc = oSelection.sfc;
                    } else if (oSelection.input) {
                        sSfc = oSelection.input;
                    } else if (oSelection.sfcData && oSelection.sfcData.length > 0) {
                        var oSfcData = oSelection.sfcData[0];
                        if (typeof oSfcData.sfc === "object" && oSfcData.sfc.sfc) {
                            sSfc = oSfcData.sfc.sfc;
                        } else if (typeof oSfcData.sfc === "string") {
                            sSfc = oSfcData.sfc;
                        }
                        sOperation = oSfcData.operation;
                    }
                    
                    if (!sOperation && oSelection.operation) {
                        if (typeof oSelection.operation === "object" && oSelection.operation.operation) {
                            sOperation = oSelection.operation.operation;
                        } else if (typeof oSelection.operation === "string") {
                            sOperation = oSelection.operation;
                        }
                    }
                }
                
                console.log("DC Chart Plugin: Extracted SFC:", sSfc, "Operation:", sOperation);
                
                if (sSfc) {
                    this._loadMeasurements(sSfc, sOperation);
                } else {
                    console.log("DC Chart Plugin: No SFC found");
                    this._showSampleData();
                }
            } catch (e) {
                console.log("DC Chart Plugin: Error getting selection", e);
                this._showSampleData();
            }
        },

        _loadMeasurements: function (sSfc, sOperation) {
            console.log("DC Chart Plugin: Loading measurements for SFC:", sSfc, "Operation:", sOperation);
            
            this._oChartModel.setProperty("/loading", true);
            this._oChartModel.setProperty("/parameterName", "Loading...");
            
            // Store SFC for filtering
            this._currentSfc = sSfc;
            
            try {
                var sPlant = this.getPodController().getUserPlant();
                
                var sUrl = this.getPublicApiRestDataSourceUri() + "/datacollection/v1/measurements";
                sUrl += "?plant=" + encodeURIComponent(sPlant);
                
                // Try both sfc and sfcs parameters for better API compatibility
                sUrl += "&sfc=" + encodeURIComponent(sSfc);
                sUrl += "&sfcs=" + encodeURIComponent(sSfc);
                
                // Add date range - last 30 days
                var oEndDate = new Date();
                var oStartDate = new Date();
                oStartDate.setDate(oStartDate.getDate() - 30);
                
                var sStartDateTime = oStartDate.toISOString().split('.')[0] + "Z";
                var sEndDateTime = oEndDate.toISOString().split('.')[0] + "Z";
                
                sUrl += "&startDateTime=" + encodeURIComponent(sStartDateTime);
                sUrl += "&endDateTime=" + encodeURIComponent(sEndDateTime);
                
                // Get more results
                sUrl += "&size=100";
                
                if (sOperation) {
                    sUrl += "&operation=" + encodeURIComponent(sOperation);
                }
                
                console.log("DC Chart Plugin: API URL:", sUrl);
                console.log("DC Chart Plugin: Filtering for SFC:", sSfc);
                
                var that = this;
                this.ajaxGetRequest(sUrl, null,
                    function (oResponse) {
                        console.log("DC Chart Plugin: API Response", oResponse);
                        that._processMeasurements(oResponse, sSfc);
                    },
                    function (oError) {
                        console.log("DC Chart Plugin: API Error", oError);
                        that._showSampleData();
                    }
                );
            } catch (e) {
                console.log("DC Chart Plugin: Error calling API", e);
                this._showSampleData();
            }
        },

        _processMeasurements: function (oResponse, sSfc) {
            this._oChartModel.setProperty("/loading", false);
            
            // Handle response
            var aMeasurements = [];
            if (Array.isArray(oResponse)) {
                aMeasurements = oResponse;
            } else if (oResponse && oResponse.data && Array.isArray(oResponse.data)) {
                aMeasurements = oResponse.data;
            } else if (oResponse && oResponse.value) {
                aMeasurements = oResponse.value;
            }
            
            console.log("DC Chart Plugin: Processing", aMeasurements.length, "measurements");
            if (aMeasurements.length > 0) {
                console.log("DC Chart Plugin: First measurement:", JSON.stringify(aMeasurements[0]));
            }
            
            if (aMeasurements.length === 0) {
                this._showSampleData();
                return;
            }
            
            // Group by parameter name and extract data
            var oGroupedData = {};
            var aAllParameters = [];
            
            aMeasurements.forEach(function (oMeasurement, iIndex) {
                // Filter by selected SFC - only process measurements for this SFC
                var sMeasurementSfc = oMeasurement.sfc || "";
                if (sMeasurementSfc && sMeasurementSfc !== sSfc) {
                    console.log("DC Chart Plugin: Skipping measurement for different SFC:", sMeasurementSfc);
                    return; // Skip this measurement
                }
                
                var oParam = oMeasurement.parameter || oMeasurement;
                
                // Get parameter/measure name
                var sMeasureName = oParam.measureName || oParam.parameterName || 
                                  oParam.dcParameterName || oParam.name || 
                                  oMeasurement.measureName || "Unknown";
                
                // Get timestamp - prefer dateCreated/createdDateTime
                var sDateTime = oMeasurement.dateCreated || oMeasurement.createdDateTime ||
                               oMeasurement.measuredAt || oMeasurement.collectedAt ||
                               oParam.dateCreated || oParam.createdDateTime ||
                               oParam.measuredAt || oParam.collectedAt;
                
                // Get value
                var nValue = 0;
                if (oParam.actual !== undefined && oParam.actual !== null) {
                    nValue = parseFloat(oParam.actual);
                } else if (oParam.measureValue !== undefined) {
                    nValue = parseFloat(oParam.measureValue);
                } else if (oParam.measuredValue !== undefined) {
                    nValue = parseFloat(oParam.measuredValue);
                } else if (oParam.value !== undefined) {
                    nValue = parseFloat(oParam.value);
                } else if (oMeasurement.actual !== undefined) {
                    nValue = parseFloat(oMeasurement.actual);
                }
                
                // Format DateTime from dateCreated
                var sDisplayTime;
                var oDate;
                if (sDateTime) {
                    oDate = new Date(sDateTime);
                    // Format as short date + time
                    sDisplayTime = oDate.toLocaleDateString() + " " + oDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else {
                    oDate = new Date();
                    sDisplayTime = "Point " + (iIndex + 1);
                }
                
                // Track unique parameters
                if (aAllParameters.indexOf(sMeasureName) === -1) {
                    aAllParameters.push(sMeasureName);
                }
                
                // Group by datetime for multi-series chart
                if (!oGroupedData[sDisplayTime]) {
                    oGroupedData[sDisplayTime] = {
                        DateTime: sDisplayTime,
                        DateTimeRaw: oDate ? oDate.getTime() : iIndex
                    };
                }
                oGroupedData[sDisplayTime][sMeasureName] = nValue;
            });
            
            // Convert to array and sort by datetime
            var aChartData = Object.values(oGroupedData);
            aChartData.sort(function(a, b) {
                return a.DateTimeRaw - b.DateTimeRaw;
            });
            
            console.log("DC Chart Plugin: Parameters found:", aAllParameters);
            console.log("DC Chart Plugin: Chart data points:", aChartData.length);
            
            // Check if we have data after filtering
            if (aChartData.length === 0 || aAllParameters.length === 0) {
                console.log("DC Chart Plugin: No data for selected SFC after filtering");
                this._showSampleData();
                return;
            }
            
            // Update model
            this._oChartModel.setProperty("/dataPoints", aChartData);
            this._oChartModel.setProperty("/parameters", aAllParameters);
            this._oChartModel.setProperty("/parameterName", "SFC: " + sSfc);
            this._oChartModel.setProperty("/hasData", aChartData.length > 0);
            
            // Rebuild chart with dynamic measures
            this._rebuildChart(aAllParameters, sSfc, aChartData.length);
        },

        _rebuildChart: function (aParameters, sSfc, iCount) {
            var oVizFrame = this.byId("dcVizFrame");
            if (!oVizFrame) return;
            
            // Remove existing feeds
            oVizFrame.destroyFeeds();
            
            // Create measure feed with all parameters
            var oMeasureFeed = new FeedItem({
                uid: "valueAxis",
                type: "Measure",
                values: aParameters
            });
            
            // Create dimension feed for datetime
            var oDimensionFeed = new FeedItem({
                uid: "categoryAxis",
                type: "Dimension",
                values: ["DateTime"]
            });
            
            // Add color feed for legend
            var oColorFeed = new FeedItem({
                uid: "color",
                type: "Dimension",
                values: []
            });
            
            oVizFrame.addFeed(oMeasureFeed);
            oVizFrame.addFeed(oDimensionFeed);
            
            // Update dataset with dynamic measures
            var oDataset = oVizFrame.getDataset();
            if (oDataset) {
                // Clear existing measures
                oDataset.destroyMeasures();
                
                // Add measure for each parameter
                aParameters.forEach(function(sParam) {
                    oDataset.addMeasure(new sap.viz.ui5.data.MeasureDefinition({
                        name: sParam,
                        value: "{chartModel>" + sParam + "}"
                    }));
                });
            }
            
            // Update title
            oVizFrame.setVizProperties({
                title: { 
                    visible: true, 
                    text: "SFC: " + sSfc + " (" + iCount + " data points, " + aParameters.length + " parameters)" 
                },
                legend: {
                    visible: aParameters.length > 1,
                    title: { visible: true, text: "Parameters" }
                }
            });
        },

        _showSampleData: function () {
            this._oChartModel.setProperty("/loading", false);
            var aSampleData = [
                { DateTime: "10:00", RPM: 100, Temperature: 25 },
                { DateTime: "10:15", RPM: 120, Temperature: 28 },
                { DateTime: "10:30", RPM: 110, Temperature: 26 },
                { DateTime: "10:45", RPM: 130, Temperature: 30 },
                { DateTime: "11:00", RPM: 115, Temperature: 27 }
            ];
            this._oChartModel.setProperty("/dataPoints", aSampleData);
            this._oChartModel.setProperty("/parameters", ["RPM", "Temperature"]);
            this._oChartModel.setProperty("/parameterName", "Sample Data");
            this._oChartModel.setProperty("/hasData", true);
            
            this._rebuildChart(["RPM", "Temperature"], "Sample", 5);
        },

        onRefreshPress: function () {
            this._loadFromCurrentSelection();
        },

        onChartTypeChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var oVizFrame = this.byId("dcVizFrame");
            if (oVizFrame) {
                oVizFrame.setVizType(sKey);
            }
        }
    });
});