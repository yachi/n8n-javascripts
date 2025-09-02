// n8n JavaScript Code Node Script - Ultimate UK Energy Forecast
// Green Score = (Embedded Wind + Large Wind + Solar) / Demand * 100
// Uses: Embedded forecasts + 14-day wind forecasts + demand forecasts

// Constants
const PERIODS_PER_DAY = 48;
const DEFAULT_DEMAND_MW = 25000;
const PERIOD_TO_MWH = 0.5; // 30-minute periods to hours

// Step 1: Fetch all four datasets
const embeddedUrl = 'https://api.neso.energy/api/3/action/datapackage_show?id=embedded-wind-and-solar-forecasts';
const wind14Url = 'https://api.neso.energy/api/3/action/datapackage_show?id=14-days-ahead-wind-forecasts';
const demandUrl = 'https://api.neso.energy/api/3/action/datapackage_show?id=1-day-ahead-demand-forecast';
const actualUrl = 'https://api.neso.energy/api/3/action/datapackage_show?id=daily-demand-update';

async function requestWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.helpers.request({ method: 'GET', url, ...options });
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

let embeddedResponse, wind14Response, demandResponse, actualResponse;
try {
  [embeddedResponse, wind14Response, demandResponse, actualResponse] = await Promise.all([
    requestWithRetry.call(this, embeddedUrl, { json: true }),
    requestWithRetry.call(this, wind14Url, { json: true }),
    requestWithRetry.call(this, demandUrl, { json: true }),
    requestWithRetry.call(this, actualUrl, { json: true })
  ]);
} catch (error) {
  return [{
    json: {
      error: "API request failed",
      message: "🔧 Data sources temporarily unavailable. Please try again later.",
      details: error.message
    }
  }];
}

const embeddedMeta = embeddedResponse;
const wind14Meta = wind14Response;
const demandMeta = demandResponse;
const actualMeta = actualResponse;

// Get CSV URLs with safe access
const embeddedCsvUrl = embeddedMeta?.result?.resources?.[0]?.path;
const wind14CsvUrl = wind14Meta?.result?.resources?.[0]?.path;
const demandCsvUrl = demandMeta?.result?.resources?.[0]?.path;
const actualCsvUrl = actualMeta?.result?.resources?.[0]?.path;

// Validate all CSV URLs exist
if (!embeddedCsvUrl || !wind14CsvUrl || !demandCsvUrl || !actualCsvUrl) {
  return [{
    json: {
      error: "Invalid API response",
      message: "🔧 Data format unexpected. Please try again later.",
      details: "Missing CSV URLs in API response"
    }
  }];
}

// Step 2: Fetch all CSV data
let embeddedData, wind14Data, demandData, actualData;
try {
  [embeddedData, wind14Data, demandData, actualData] = await Promise.all([
    requestWithRetry.call(this, embeddedCsvUrl, {}),
    requestWithRetry.call(this, wind14CsvUrl, {}),
    requestWithRetry.call(this, demandCsvUrl, {}),
    requestWithRetry.call(this, actualCsvUrl, {})
  ]);
} catch (error) {
  return [{
    json: {
      error: "CSV data fetch failed",
      message: "🔧 Unable to fetch forecast data. Please try again later.",
      details: error.message
    }
  }];
}

const embeddedText = embeddedData;
const wind14Text = wind14Data;
const demandText = demandData;
const actualText = actualData;

// Step 3: Parse CSV data
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Improved regex to handle CSV with embedded commas in quoted fields
    const values = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
      .map(v => v.replace(/^"|"$/g, '').trim());
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Convert to number if numeric
      if (!isNaN(value) && value !== '') {
        value = parseFloat(value);
      }
      row[header] = value;
    });
    data.push(row);
  }
  return data;
}

const embedded = parseCSV(embeddedText);
const wind14 = parseCSV(wind14Text);
const demand = parseCSV(demandText);
const actual = parseCSV(actualText);

// Step 4: Get latest actual data for comparison
const actualDataFiltered = actual.filter(row => row.FORECAST_ACTUAL_INDICATOR === 'A');
const actualDates = [...new Set(actualDataFiltered.map(row => row.SETTLEMENT_DATE))].sort();
const latestActualDate = actualDates[actualDates.length - 1];
const latestActualData = actualDataFiltered.filter(row => row.SETTLEMENT_DATE === latestActualDate);

let latestActualScore = null;
if (latestActualData.length > 0) {
  const totals = latestActualData.reduce((acc, row) => {
    acc.demand += row.ENGLAND_WALES_DEMAND || 0;
    acc.embeddedWind += row.EMBEDDED_WIND_GENERATION || 0;
    acc.solar += row.EMBEDDED_SOLAR_GENERATION || 0;
    acc.count++;
    return acc;
  }, { demand: 0, embeddedWind: 0, solar: 0, count: 0 });
  
  if (totals.demand > 0) {
    const totalRenewable = totals.embeddedWind + totals.solar;
    const greenScore = Math.round((totalRenewable / totals.demand) * 100);
    
    latestActualScore = {
      date: latestActualDate,
      greenScore: greenScore,
      avgEmbeddedWind: Math.round(totals.embeddedWind / totals.count),
      avgSolar: Math.round(totals.solar / totals.count),
      avgDemand: Math.round(totals.demand / totals.count)
    };
  }
}

// Step 5: Process Day Ahead demand forecasts by date
const demandByDate = {};
demand.forEach(row => {
  const dateStr = row.TARGETDATE.toString();
  const date = `${dateStr.slice(0,4)}-${dateStr.slice(4,6)}-${dateStr.slice(6,8)}`;
  
  if (!demandByDate[date]) {
    demandByDate[date] = [];
  }
  demandByDate[date].push(row.FORECASTDEMAND);
});

Object.keys(demandByDate).forEach(date => {
  const demands = demandByDate[date];
  demandByDate[date] = demands.reduce((sum, d) => sum + d, 0) / demands.length;
});

// Step 6: Process wind14 data by date and period
const wind14ByDatePeriod = {};
wind14.forEach(row => {
  const key = `${row.Date}_${row.Settlement_period}`;
  wind14ByDatePeriod[key] = row.Wind_Forecast || 0;
});

// Step 7: Process embedded forecasts by date and period
const embeddedByDatePeriod = {};
embedded.forEach(row => {
  const date = row.SETTLEMENT_DATE.split('T')[0];
  const key = `${date}_${row.SETTLEMENT_PERIOD}`;
  embeddedByDatePeriod[key] = {
    wind: row.EMBEDDED_WIND_FORECAST || 0,
    solar: row.EMBEDDED_SOLAR_FORECAST || 0
  };
});

// Step 8: Create 7-day forecast
const today = new Date();
const weekDates = [];
for (let i = 0; i < 7; i++) {
  const date = new Date(today);
  date.setDate(today.getDate() + i);
  weekDates.push(date.toISOString().split('T')[0]);
}

const weeklyForecast = [];

weekDates.forEach(date => {
  let totalEmbeddedWind = 0;
  let totalLargeWind = 0;
  let totalSolar = 0;
  let periodCount = 0;
  
  // Sum all periods for the day
  for (let period = 1; period <= PERIODS_PER_DAY; period++) {
    const key = `${date}_${period}`;
    
    // Get embedded wind and solar
    const embeddedData = embeddedByDatePeriod[key];
    if (embeddedData) {
      totalEmbeddedWind += embeddedData.wind;
      totalSolar += embeddedData.solar;
    }
    
    // Get large wind
    const largeWind = wind14ByDatePeriod[key] || 0;
    totalLargeWind += largeWind;
    
    if (embeddedData || largeWind > 0) {
      periodCount++;
    }
  }
  
  if (periodCount > 0) {
    const avgEmbeddedWind = totalEmbeddedWind / periodCount;
    const avgLargeWind = totalLargeWind / periodCount;
    const avgSolar = totalSolar / periodCount;
    const avgTotalWind = avgEmbeddedWind + avgLargeWind;
    const totalRenewable = avgTotalWind + avgSolar;
    
    // Get demand forecast for this date
    const avgDemand = demandByDate[date] || (latestActualScore ? latestActualScore.avgDemand : DEFAULT_DEMAND_MW);
    
    const greenScore = Math.round((totalRenewable / avgDemand) * 100);
    
    weeklyForecast.push({
      date: date,
      greenScore: greenScore,
      avgEmbeddedWind: Math.round(avgEmbeddedWind),
      avgLargeWind: Math.round(avgLargeWind),
      avgTotalWind: Math.round(avgTotalWind),
      avgSolar: Math.round(avgSolar),
      avgDemand: Math.round(avgDemand),
      totalRenewableMWh: Math.round((totalEmbeddedWind + totalLargeWind + totalSolar) * PERIOD_TO_MWH),
      totalDemandMWh: Math.round(avgDemand * PERIODS_PER_DAY * PERIOD_TO_MWH)
    });
  }
});

// Step 9: Calculate statistics
const avgWeekScore = weeklyForecast.length > 0 
  ? Math.round(weeklyForecast.reduce((sum, day) => sum + day.greenScore, 0) / weeklyForecast.length)
  : 0;

const bestDay = weeklyForecast.reduce((best, day) => 
  !best || day.greenScore > best.greenScore ? day : best, null);
const worstDay = weeklyForecast.reduce((worst, day) => 
  !worst || day.greenScore < worst.greenScore ? day : worst, null);

// Step 10: Helper functions
function getRatingEmoji(score) {
  if (score >= 80) return "😍";
  if (score >= 60) return "😊";
  if (score >= 40) return "😐";
  if (score >= 20) return "😕";
  return "😞";
}

function getRatingText(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

function getDayName(dateStr) {
  const date = new Date(dateStr + 'T12:00:00Z');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getUTCDay()];
}

function getProgressBar(score, width = 10) {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Step 11: Generate Telegram message
let telegramMessage = `🌱 **UK Green Energy Outlook**\n`;

// Latest actual data
if (latestActualScore) {
  telegramMessage += `📊 Yesterday: **${latestActualScore.greenScore}% green energy** ${getRatingEmoji(latestActualScore.greenScore)}\n\n`;
}

// Weekly average
telegramMessage += `📈 This week: **${avgWeekScore}% renewable** ${getRatingEmoji(avgWeekScore)}\n\n`;

// Daily forecast
weeklyForecast.forEach(day => {
  const dayName = getDayName(day.date);
  const emoji = getRatingEmoji(day.greenScore);
  const bar = getProgressBar(day.greenScore);
  
  telegramMessage += `**${dayName}** ${emoji} ${day.greenScore}% ${bar}\n`;
});

// Best and worst days
if (bestDay && worstDay && weeklyForecast.length > 1) {
  telegramMessage += `\n🏆 Best: ${getDayName(bestDay.date)} (${bestDay.greenScore}%)\n`;
  telegramMessage += `⚡ Lowest: ${getDayName(worstDay.date)} (${worstDay.greenScore}%)\n`;
}

// Simple week summary
telegramMessage += `\n💭 `;
if (avgWeekScore >= 60) {
  telegramMessage += `Great week for renewables ahead!`;
} else if (avgWeekScore >= 40) {
  telegramMessage += `Good renewable energy week expected.`;
} else {
  telegramMessage += `Mixed week - some good green days coming.`;
}


// Return for n8n (must be an array of objects)
return [{
  json: {
    message: telegramMessage,
    weekAverageScore: avgWeekScore,
    latestActualScore: latestActualScore?.greenScore || 0,
    dailyScores: weeklyForecast.map(d => ({
      date: d.date,
      score: d.greenScore,
      embeddedWind: d.avgEmbeddedWind,
      largeWind: d.avgLargeWind,
      totalWind: d.avgTotalWind,
      solar: d.avgSolar,
      demand: d.avgDemand
    })),
    bestDay: bestDay ? { date: bestDay.date, score: bestDay.greenScore } : null,
    worstDay: worstDay ? { date: worstDay.date, score: worstDay.greenScore } : null,
    dataSources: [
      "Embedded Wind & Solar Forecasts (14-day)",
      "14 Days Ahead Wind Forecasts", 
      "Day Ahead National Demand Forecasts (time-varying 18-28GW)",
      "Daily Demand Update (actual data)"
    ],
    formula: "Green Score = (Embedded Wind + Large Wind + Solar) / Demand * 100"
  }
}];