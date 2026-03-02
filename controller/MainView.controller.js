sap.ui.define([
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/ui/model/json/JSONModel"
], function (PluginViewController, JSONModel) {
    "use strict";

    return PluginViewController.extend("sap.dm.custom.plugin.dcchartext.dcchartext.controller.MainView", {

        onInit: function () {
            if (PluginViewController.prototype.onInit) {
                PluginViewController.prototype.onInit.apply(this, arguments);
            }
            
            // Initialize chart model with empty data
            this._oChartModel = new JSONModel({
                dataPoints: []
            });
            this._oChartModel.setSizeLimit(10000);
            this.getView().setModel(this._oChartModel, "chartModel");
            
            // Store for all data
            this._allDataPoints = [];
            
            this._subscribeToEvents();
        },

        onAfterRendering: function () {
            this._initChart();
            this._loadFromCurrentSelection();
        },

        onExit: function () {
            this._unsubscribeFromEvents();
            if (PluginViewController.prototype.onExit) {
                PluginViewController.prototype.onExit.apply(this, arguments);
            }
        },

        _subscribeToEvents: function () {
            this.subscribe("PodSelectionChangeEvent", this._onSelectionChange, this);
            this.subscribe("WorklistSelectEvent", this._onSelectionChange, this);
            console.log("DC Chart: Events subscribed");
        },

        _unsubscribeFromEvents: function () {
            this.unsubscribe("PodSelectionChangeEvent", this._onSelectionChange, this);
            this.unsubscribe("WorklistSelectEvent", this._onSelectionChange, this);
        },

        _onSelectionChange: function () {
            this._loadFromCurrentSelection();
        },

        _initChart: function () {
            var oVizFrame = this.byId("dcVizFrame");
            if (oVizFrame) {
                oVizFrame.setVizProperties({
                    plotArea: {
                        colorPalette: ["#5899DA", "#E8743B", "#19A979", "#ED4A7B", "#945ECF"],
                        line: { width: 2 },
                        marker: { visible: true, size: 6 },
                        dataLabel: { visible: false }
                    },
                    title: { visible: true, text: "Data Collection" },
                    legend: { visible: true }
                });
            }
        },

        _loadFromCurrentSelection: function () {
            try {
                var oPodSelectionModel = this.getPodSelectionModel();
                if (!oPodSelectionModel) {
                    this._showSampleData();
                    return;
                }
                
                var oSelection = oPodSelectionModel.getSelection();
                var sSfc = null;
                
                if (oSelection) {
                    if (oSelection.sfc && oSelection.sfc.sfc) {
                        sSfc = oSelection.sfc.sfc;
                    } else if (oSelection.input) {
                        sSfc = oSelection.input;
                    }
                }
                
                console.log("DC Chart: SFC =", sSfc);
                
                if (sSfc) {
                    this._loadMeasurements(sSfc);
                } else {
                    this._showSampleData();
                }
            } catch (e) {
                console.log("DC Chart: Error", e);
                this._showSampleData();
            }
        },

        _loadMeasurements: function (sSfc) {
            var sPlant = this.getPodController().getUserPlant();
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 30);
            
            var sUrl = this.getPublicApiRestDataSourceUri() + "/datacollection/v1/measurements";
            sUrl += "?plant=" + encodeURIComponent(sPlant);
            sUrl += "&sfc=" + encodeURIComponent(sSfc);
            sUrl += "&startDateTime=" + encodeURIComponent(oStartDate.toISOString().split('.')[0] + "Z");
            sUrl += "&endDateTime=" + encodeURIComponent(oEndDate.toISOString().split('.')[0] + "Z");
            sUrl += "&size=100&page=0";
            
            console.log("DC Chart: Loading", sUrl);
            
            var that = this;
            this._currentSfc = sSfc;
            this._allMeasurements = [];
            
            this.ajaxGetRequest(sUrl, null,
                function (oResponse) {
                    that._handleResponse(oResponse, sSfc, 0);
                },
                function (oError) {
                    console.log("DC Chart: API Error", oError);
                    that._showSampleData();
                }
            );
        },

        _handleResponse: function (oResponse, sSfc, iPage) {
            var aData = (oResponse && oResponse.data) ? oResponse.data : [];
            this._allMeasurements = this._allMeasurements.concat(aData);
            
            var iTotalPages = oResponse.numberOfPages || 1;
            var iNextPage = iPage + 1;
            
            console.log("DC Chart: Page", iPage, "loaded,", aData.length, "items. Total:", this._allMeasurements.length);
            
            if (iNextPage < iTotalPages && aData.length > 0) {
                // Load next page
                var sPlant = this.getPodController().getUserPlant();
                var oEndDate = new Date();
                var oStartDate = new Date();
                oStartDate.setDate(oStartDate.getDate() - 30);
                
                var sUrl = this.getPublicApiRestDataSourceUri() + "/datacollection/v1/measurements";
                sUrl += "?plant=" + encodeURIComponent(sPlant);
                sUrl += "&sfc=" + encodeURIComponent(sSfc);
                sUrl += "&startDateTime=" + encodeURIComponent(oStartDate.toISOString().split('.')[0] + "Z");
                sUrl += "&endDateTime=" + encodeURIComponent(oEndDate.toISOString().split('.')[0] + "Z");
                sUrl += "&size=100&page=" + iNextPage;
                
                var that = this;
                this.ajaxGetRequest(sUrl, null,
                    function (oResp) {
                        that._handleResponse(oResp, sSfc, iNextPage);
                    },
                    function () {
                        that._processAndDisplay(sSfc);
                    }
                );
            } else {
                this._processAndDisplay(sSfc);
            }
        },

        _processAndDisplay: function (sSfc) {
            console.log("DC Chart: Processing", this._allMeasurements.length, "measurements");
            
            var aChartData = [];
            var oParamsSet = {};
            
            this._allMeasurements.forEach(function (oMeasurement, idx) {
                var oParam = oMeasurement.parameter || {};
                
                var sMeasureName = oParam.measureName || "Value";
                var sActual = oParam.actual;
                var sDateCreated = oParam.dateCreated;
                
                oParamsSet[sMeasureName] = true;
                
                var nValue = parseFloat(sActual) || 0;
                var sDisplayTime = "Point " + (idx + 1);
                var nSortKey = idx;
                
                if (sDateCreated) {
                    var oDate = new Date(sDateCreated);
                    nSortKey = oDate.getTime();
                    sDisplayTime = (oDate.getMonth() + 1) + "/" + oDate.getDate() + " " + 
                                   oDate.getHours() + ":" + String(oDate.getMinutes()).padStart(2, '0');
                }
                
                aChartData.push({
                    DateTime: sDisplayTime,
                    Value: nValue,
                    ParameterName: sMeasureName,
                    SortKey: nSortKey
                });
            });
            
            // Sort by time
            aChartData.sort(function(a, b) { return a.SortKey - b.SortKey; });
            
            var aParams = Object.keys(oParamsSet).sort();
            console.log("DC Chart: Parameters:", aParams, "Data points:", aChartData.length);
            
            // Store all data
            this._allDataPoints = aChartData;
            
            // Update parameter dropdown
            this._updateParameterDropdown(aParams);
            
            // Log first few data points for debugging
            console.log("DC Chart: First 3 data points:", JSON.stringify(aChartData.slice(0, 3)));
            
            // Set data to model
            this._oChartModel.setProperty("/dataPoints", aChartData);
            
            // Force model refresh
            this._oChartModel.refresh(true);
            
            // Update title and rebind dataset
            var oVizFrame = this.byId("dcVizFrame");
            if (oVizFrame) {
                oVizFrame.setVizProperties({
                    title: { text: "SFC: " + sSfc + " (" + aChartData.length + " points)" }
                });
                
                // Get the dataset and rebind it to force refresh
                var oDataset = oVizFrame.getDataset();
                if (oDataset) {
                    oDataset.bindData("chartModel>/dataPoints");
                    console.log("DC Chart: Dataset rebound");
                }
            }
            
            console.log("DC Chart: Model updated with", aChartData.length, "points");
            console.log("DC Chart: Model data check:", this._oChartModel.getProperty("/dataPoints").length);
        },

        _updateParameterDropdown: function (aParams) {
            var oSelect = this.byId("parameterSelect");
            if (oSelect) {
                oSelect.removeAllItems();
                oSelect.addItem(new sap.ui.core.Item({ key: "ALL", text: "All (" + this._allDataPoints.length + ")" }));
                aParams.forEach(function(sParam) {
                    var iCount = this._allDataPoints.filter(function(d) { return d.ParameterName === sParam; }).length;
                    oSelect.addItem(new sap.ui.core.Item({ key: sParam, text: sParam + " (" + iCount + ")" }));
                }.bind(this));
                oSelect.setSelectedKey("ALL");
            }
        },

        _showSampleData: function () {
            var aSampleData = [
                { DateTime: "10:00", Value: 100, ParameterName: "RPM" },
                { DateTime: "10:00", Value: 25, ParameterName: "Temp" },
                { DateTime: "10:15", Value: 120, ParameterName: "RPM" },
                { DateTime: "10:15", Value: 28, ParameterName: "Temp" },
                { DateTime: "10:30", Value: 110, ParameterName: "RPM" },
                { DateTime: "10:30", Value: 26, ParameterName: "Temp" },
                { DateTime: "10:45", Value: 130, ParameterName: "RPM" },
                { DateTime: "10:45", Value: 30, ParameterName: "Temp" }
            ];
            
            this._allDataPoints = aSampleData;
            this._oChartModel.setProperty("/dataPoints", aSampleData);
            this._updateParameterDropdown(["RPM", "Temp"]);
            
            var oVizFrame = this.byId("dcVizFrame");
            if (oVizFrame) {
                oVizFrame.setVizProperties({ title: { text: "Sample Data" } });
            }
        },

        onParameterChange: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getKey();
            var aFiltered = sKey === "ALL" ? this._allDataPoints : 
                           this._allDataPoints.filter(function(d) { return d.ParameterName === sKey; });
            this._oChartModel.setProperty("/dataPoints", aFiltered);
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