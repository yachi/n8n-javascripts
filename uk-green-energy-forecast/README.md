# UK Green Energy Forecast

An n8n JavaScript script that generates 7-day UK green energy forecasts with emoji ratings and progress bars for Telegram notifications.

## Features

✅ **7-day forecast** with daily renewable energy percentages  
✅ **Visual progress bars** showing green energy proportion  
✅ **Real-time data** from NESO (National Energy System Operator) APIs  
✅ **Wind and solar forecasts** from multiple data sources  
✅ **Weekly statistics** including best/worst days and averages  
✅ **Error handling** for API failures and data validation  

## Files

- **`main.js`** - Main n8n JavaScript Code Node script
- **`test.js`** - Test suite
- **`README.md`** - This documentation
- **`AGENTS.md`** - Development guidelines

## Usage

### For n8n:
1. Copy the content of `main.js`
2. Paste into an n8n JavaScript Code Node
3. Connect to a Telegram node for messaging
4. Schedule to run daily (recommended: 9:30 AM GMT after NESO data updates)

### For testing:
```bash
node test.js
```

## Sample Output

```
🌱 **UK Green Energy Outlook**

📈 This week: **61% green energy** 😊
*(Progress bars show daily green energy %)*

Mon 😍  85% █████████░
Tue 😊  72% ███████░░░
Wed 😊  68% ██████░░░░
Thu 😐  45% ████░░░░░░
Fri 😕  32% ███░░░░░░░
Sat 😊  64% ██████░░░░
Sun 😊  71% ███████░░░

📈 Highest: Mon (85%)
📉 Lowest: Fri (32%)

💭 Good green energy week expected. High variability expected.
```

## Data Sources

- **NESO Embedded Wind & Solar Forecasts** (14-day)
- **NESO 14 Days Ahead Wind Forecasts**  
- **NESO Day Ahead National Demand Forecasts** (time-varying)
- **NESO Daily Demand Update** (actual data)

## Rating System

- ⚡ **120%+** Major Surplus (possible negative pricing)
- 🔋 **100-119%** Surplus (exports likely)  
- 🟢 **80-99%** Excellent (renewable energy dominant)
- 🟡 **60-79%** Good (strong renewable mix)
- 🟠 **40-59%** Moderate (balanced energy mix)
- 🔴 **20-39%** Poor (fossil fuel dominant)
- 😞 **<20%** Very Poor (minimal renewables)

## Technical Details

**Green Score Formula:** `(Embedded Wind + Large Wind + Solar) / Demand × 100`

**Data Processing:** Fetches data from 4 NESO API endpoints and calculates daily averages from half-hourly forecasts.

**Update Frequency:** NESO data updates twice daily at 09:00 and 12:00 GMT.

---

*UK renewable energy forecasting script for n8n automation.*
