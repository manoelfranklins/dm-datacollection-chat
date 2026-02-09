# SAP Digital Manufacturing - Data Collection Chart Plugin

A custom POD (Production Operator Dashboard) plugin extension for SAP Digital Manufacturing that visualizes Data Collection measurements as an interactive chart.

<img width="1237" height="484" alt="image" src="https://github.com/user-attachments/assets/cebd931b-e7df-4a19-af5e-5475d1106c31" />
<img width="1238" height="482" alt="image" src="https://github.com/user-attachments/assets/75d8d766-3507-4795-bc9b-1a8074007314" />
<img width="1240" height="487" alt="image" src="https://github.com/user-attachments/assets/6893adb4-d55d-41fb-8541-6960e5fe29b9" />


## 🎯 Features

- **Multi-Series Line Chart**: Displays multiple data collection parameters as separate colored lines
- **Real-time Data**: Automatically loads measurements when an SFC is selected in the POD
- **Interactive Legend**: Shows parameter names with color coding
- **Multiple Chart Types**: Switch between Line, Column, and Scatter chart visualizations
- **Date/Time X-Axis**: Shows measurement timestamps (dateCreated) on the X-axis
- **Auto-Refresh**: Updates automatically when SFC or Operation selection changes
- **Manual Refresh**: Refresh button to reload data on demand
- **Responsive Design**: Adapts to POD layout sizing

## 🚀 Installation

### Step 1: Download the Plugin

Clone or download this repository:

```bash
git clone https://github.com/AnttonLA/extendDataCollectionWithChart.git
```

### Step 2: Create ZIP Package

Create a ZIP file containing all plugin files:

```
extendDataCollectionWithChart/
├── Component.js
├── ExtensionProvider.js
├── manifest.json
├── index.html
├── serviceBindings.js
├── builder/
│   └── PropertyEditor.js
├── controller/
│   └── MainView.controller.js
├── css/
│   └── style.css
├── designer/
│   └── components.json
├── i18n/
│   ├── builder.properties
│   ├── builder_en.properties
│   ├── i18n.properties
│   └── i18n_en.properties
├── models/
│   └── models.js
└── view/
    └── MainView.view.xml
```

### Step 3: Upload to SAP DM

1. Navigate to **POD Designer** in SAP Digital Manufacturing
2. Open **Extensions** tab and click **Create** to add a new custom extension
3. Upload the ZIP file
4. Provide the following details:
   - **Extension Name**: Data Collection Chart
   - **Extension ID**: dcchartext
   - **Namespace**: sap.dm.custom.plugin.dcchartext.dcchartext
5. Click **Save**

<img width="1912" height="708" alt="image" src="https://github.com/user-attachments/assets/50a831ca-e098-4a55-901a-d70c69308ff8" />

### Step 4: Add to POD Designer

1. Open **POD Designer**
2. Select or create a POD
3. In the plugin list, find **"Data Collection Chart"** 
4. Drag and drop the plugin into your POD layout
5. Configure the plugin properties as needed
6. Save and activate the POD

## 📊 Usage

### Basic Usage

1. Open the POD containing the Data Collection Chart plugin
2. Select an SFC from the worklist
3. The chart automatically loads and displays measurement data for the selected SFC
4. Data points are grouped by parameter name (measureName) with different colored lines

### Chart Controls

| Control | Description |
|---------|-------------|
| **Chart Type Dropdown** | Switch between Line, Column, and Scatter visualizations |
| **Refresh Button** | Manually reload measurement data |
| **Legend** | Click to show/hide specific parameters |

### Supported POD Types

- Work Center POD
- Operation POD
- Order POD
- Other POD
- Monitor POD

## 🔧 Configuration

### Plugin Properties

The plugin can be configured through the POD Designer property editor:

| Property | Description | Default |
|----------|-------------|---------|
| Title | Plugin header title | "Data Collection Chart" |
| Visible | Show/hide the plugin | true |

### Data Source

The plugin uses the SAP DM Data Collection API:

```
GET /datacollection/v1/measurements
```

**Parameters:**
- `plant` - Plant ID (auto-detected from POD)
- `sfc` - Selected SFC number
- `startDateTime` - Start of date range (30 days ago)
- `endDateTime` - End of date range (now)
- `size` - Number of results (100)
- `operation` - Operation filter (if selected)

## 📁 File Structure

```
extendDataCollectionWithChart/
├── Component.js              # UI5 Component definition
├── ExtensionProvider.js      # POD extension provider
├── manifest.json             # Application manifest
├── index.html               # Standalone testing page
├── serviceBindings.js       # Service configuration
├── builder/
│   └── PropertyEditor.js    # POD Designer property editor
├── controller/
│   └── MainView.controller.js  # Main controller with chart logic
├── css/
│   └── style.css            # Custom styles
├── designer/
│   └── components.json      # Plugin registration for POD Designer
├── i18n/
│   ├── builder.properties   # Builder translations (default)
│   ├── builder_en.properties # Builder translations (English)
│   ├── i18n.properties      # UI translations (default)
│   └── i18n_en.properties   # UI translations (English)
├── models/
│   └── models.js            # Model helpers
└── view/
    └── MainView.view.xml    # Main view with VizFrame chart
```

## 🔌 API Response Format

The plugin expects the following response structure from the Data Collection API:

```json
{
  "numberOfPages": 5,
  "count": 97,
  "currentPage": 0,
  "data": [
    {
      "plant": "1710",
      "sfc": "171010283",
      "dateCreated": "2026-02-09T10:30:00Z",
      "parameter": {
        "measureName": "RPM",
        "actual": 222
      }
    },
    {
      "plant": "1710",
      "sfc": "171010283",
      "dateCreated": "2026-02-09T10:30:00Z",
      "parameter": {
        "measureName": "Temperature",
        "actual": 35
      }
    }
  ]
}
```

## 🎨 Customization

### Color Palette

Modify the color palette in `MainView.controller.js`:

```javascript
colorPalette: ["#5899DA", "#E8743B", "#19A979", "#ED4A7B", "#945ECF", "#13A4B4"]
```

### Date Range

Adjust the default date range for data retrieval:

```javascript
// In _loadMeasurements function
oStartDate.setDate(oStartDate.getDate() - 30);  // Change 30 to desired days
```

### Chart Properties

Customize chart appearance in `_initChart` function:

```javascript
oVizFrame.setVizProperties({
    plotArea: {
        dataLabel: { visible: true },
        line: { visible: true, width: 2 },
        marker: { visible: true, size: 6 }
    },
    // ... other properties
});
```

## 🐛 Troubleshooting

### Chart shows "Sample Data"

- Verify the selected SFC has data collection measurements
- Check browser console for API errors
- Ensure the date range covers the measurement timestamps

### API returns 400 Bad Request

- Verify timestamp format is `YYYY-MM-DDThh:mm:ssZ`
- Check that plant ID is correctly detected
- Ensure SFC exists in the system

### No lines between points

- Verify `line.visible: true` is set in vizProperties
- Check that data points have valid numeric values

### Plugin not appearing in POD Designer

- Verify `components.json` has correct supportedPodTypes
- Check that all required files are included in the ZIP
- Review deployment logs for errors

## 📝 Events Subscribed

The plugin listens to these POD events:

| Event | Description |
|-------|-------------|
| `PodSelectionChangeEvent` | Triggered when POD selection changes |
| `OperationListSelectEvent` | Triggered when operation is selected |
| `WorklistSelectEvent` | Triggered when worklist item is selected |
| `OperationChangeEvent` | Triggered when operation changes |

## 🔗 Related Resources

- [SAP Digital Manufacturing Documentation](https://help.sap.com/docs/sap-digital-manufacturing)
- [SAP DM Data Collection API](https://api.sap.com/api/sapdme_datacollection)
- [SAP UI5 VizFrame Documentation](https://sapui5.hana.ondemand.com/#/api/sap.viz.ui5.controls.VizFrame)
- [SAP DM Extension Samples](https://github.com/SAP-samples/digital-manufacturing-extension-samples)

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Manoel Costa
http://manoelcosta.com/
