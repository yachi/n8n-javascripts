# UK Green Energy Forecast

A comprehensive n8n JavaScript script that generates 7-day UK green energy forecasts with daily ratings and visual progress bars for Telegram notifications.

## Features

✅ **7-day forecast** with daily green energy ratings  
✅ **Visual progress bars** showing renewable percentage  
✅ **Accurate data** using NESO (National Energy System Operator) APIs  
✅ **Time-varying demand** patterns (18-28 GW cycles)  
✅ **Complete wind data** (embedded + large wind farms)  
✅ **Cross-validated** against emoncms.org patterns  
✅ **Weekly statistics** and trend analysis  

## Files

- **`main.js`** - Main n8n JavaScript Code Node script
- **`test.js`** - Standalone test script
- **`README.md`** - This documentation

## Usage

### For n8n:
1. Copy the content of `main.js`
2. Paste into an n8n JavaScript Code Node
3. Connect to a Telegram node for messaging

### For testing:
```bash
node test.js
```

## Sample Output

```
📅 Daily Forecast:
• **Wed 09-03:** ✅ **66%** ███████░░░
  🌪️ 13785MW wind (2679MW + 11106MW)
  ☀️ 1722MW solar | 📊 23458MW demand

• **Thu 09-04:** ✅ **64%** ██████░░░░
  🌪️ 9665MW wind (1547MW + 8117MW)
  ☀️ 2481MW solar | 📊 19114MW demand

• **Sun 09-07:** 🌟 **97%** ██████████
  🌪️ 16528MW wind (2768MW + 13760MW)
  ☀️ 1924MW solar | 📊 19114MW demand
```

## Data Sources

- **NESO Embedded Wind & Solar Forecasts** (14-day)
- **NESO 14 Days Ahead Wind Forecasts**  
- **NESO Day Ahead National Demand Forecasts** (time-varying)
- **NESO Daily Demand Update** (actual data)

## Rating System

- 🌟 **80%+** Excellent (green energy dominant)
- ✅ **60-79%** Good (strong renewable mix)
- ⚡ **40-59%** Moderate (balanced mix)
- ⚠️ **20-39%** Poor (fossil fuel dominant)
- 🔴 **<20%** Very Poor (minimal renewables)

## Technical Details

**Green Score Formula:** `(Embedded Wind + Large Wind + Solar) / Demand × 100`

**Data Accuracy:** Cross-validated with emoncms.org to ensure realistic demand cycles and renewable percentages.

**Update Frequency:** NESO data updates twice daily (09:00-09:15 and 12:00-12:15 GMT)

---

*Generated for UK electricity system analysis and renewable energy tracking.*
