// Simple test for main.js
// This creates a standalone version for testing the n8n script

(async function() {
  console.log('🧪 Testing main.js');
  console.log('📊 7-day forecast with daily ratings and progress bars');
  console.log('✅ Using corrected Day Ahead Demand Forecast data');
  console.log('');

  try {
    // Copy the script content (without the n8n return statement)
    const fs = require('fs');
    let scriptContent = fs.readFileSync('./main.js', 'utf8');
    
    // Modify for testing: capture the result instead of returning it
    scriptContent = scriptContent.replace(
      'return [{',
      'const result = [{'
    ).replace(
      /}];\s*$/,
      '}]; console.log("\\n" + result[0].json.message);'
    );
    
    // Execute the modified script
    eval('(async function() { ' + scriptContent + ' })()');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 The script is designed for n8n environment.');
    console.log('   Copy the content to an n8n JavaScript Code Node to use it.');
  }
})();