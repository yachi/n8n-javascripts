// Simple test for main.js
// This creates a standalone version for testing the n8n script

const fs = require('fs');

// Import formatDate from main.js to avoid code duplication
function getFunctionFromMain(functionName) {
  const mainCode = fs.readFileSync('./main.js', 'utf8');

  // Extract function from main.js
  const funcMatch = mainCode.match(new RegExp(`function ${functionName}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
  if (!funcMatch) {
    throw new Error(`${functionName} function not found in main.js`);
  }

  // Create and return the function
  const funcCode = funcMatch[0];
  const func = new Function('return ' + funcCode)();
  return func;
}

// Test formatDate function for the n8n error fix
function testDateFormatting() {
  console.log('🧪 Testing formatDate function (n8n error fix)');
  console.log('━'.repeat(40));

  try {
    const formatDate = getFunctionFromMain('formatDate');
   
    const testCases = [
      { input: 20241209, expected: '2024-12-09', desc: 'Numeric (n8n TARGETDATE)' },
      { input: '20241209', expected: '2024-12-09', desc: 'String YYYYMMDD' },
      { input: '2024-12-09T10:30:00', expected: '2024-12-09', desc: 'ISO with time' },
    ];
  
    let allPassed = true;
    testCases.forEach(test => {
      const result = formatDate(test.input);
      const passed = result === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${test.input} → ${result}`);
      if (!passed) allPassed = false;
    });
  
    console.log('━'.repeat(40));
    console.log(allPassed ? '✅ All date tests passed!\n' : '❌ Some date tests failed!\n');
    return allPassed;
  } catch (error) {
    console.log('❌ Failed to load formatDate from main.js:', error.message);
    console.log('━'.repeat(40));
    console.log('❌ Date tests failed!\n');
    return false;
  }
}

// Test parseCSV function
function testCSVParsing() {
  console.log('🧪 Testing parseCSV function');
  console.log('━'.repeat(40));

  try {
    const parseCSV = getFunctionFromMain('parseCSV');

    const testCases = [
      {
        input: 'col1,col2,col3\nvalue1,value2,value3',
        expected: [{ col1: 'value1', col2: 'value2', col3: 'value3' }],
        desc: 'Simple CSV'
      },
      {
        input: 'name,age,score\nJohn,25,95.5\nJane,30,87.2',
        expected: [
          { name: 'John', age: 25, score: 95.5 },
          { name: 'Jane', age: 30, score: 87.2 }
        ],
        desc: 'CSV with numbers'
      },
      {
        input: 'field1,field2\n"value,with comma",normal\n"quoted value",123',
        expected: [
          { field1: 'value,with comma', field2: 'normal' },
          { field1: 'quoted value', field2: 123 }
        ],
        desc: 'CSV with quoted fields containing commas'
      }
    ];

    let allPassed = true;
    testCases.forEach((test, index) => {
      const result = parseCSV(test.input);
      const passed = JSON.stringify(result) === JSON.stringify(test.expected);
      console.log(`${passed ? '✅' : '❌'} ${test.desc}`);
      if (!passed) {
        console.log(`  Expected: ${JSON.stringify(test.expected)}`);
        console.log(`  Got: ${JSON.stringify(result)}`);
        allPassed = false;
      }
    });

    console.log('━'.repeat(40));
    console.log(allPassed ? '✅ All CSV tests passed!\n' : '❌ Some CSV tests failed!\n');
    return allPassed;
  } catch (error) {
    console.log('❌ Failed to load parseCSV from main.js:', error.message);
    console.log('━'.repeat(40));
    console.log('❌ CSV tests failed!\n');
    return false;
  }
}

// Test error handling paths
function testErrorHandling() {
  console.log('🧪 Testing error handling');
  console.log('━'.repeat(40));

  let allPassed = true;

  // Test missing function handling
  try {
    getFunctionFromMain('nonExistentFunction');
    console.log('❌ Should have thrown error for missing function');
    allPassed = false;
  } catch (error) {
    const expectedMessage = 'nonExistentFunction function not found in main.js';
    const passed = error.message === expectedMessage;
    console.log(`${passed ? '✅' : '❌'} Missing function error: ${passed ? 'correct' : 'wrong'} message`);
    if (!passed) allPassed = false;
  }

  console.log('━'.repeat(40));
  console.log(allPassed ? '✅ All error tests passed!\n' : '❌ Some error tests failed!\n');
  return allPassed;
}


// Test helper functions
function testHelperFunctions() {
  console.log('🧪 Testing helper functions');
  console.log('━'.repeat(40));

  try {
    const getRatingEmoji = getFunctionFromMain('getRatingEmoji');
    const getDayName = getFunctionFromMain('getDayName');
    const getProgressBar = getFunctionFromMain('getProgressBar');

    let allPassed = true;

    // Test getRatingEmoji
    const emojiTests = [
      { input: 90, expected: '😍', desc: 'Excellent rating (90%)' },
      { input: 70, expected: '😊', desc: 'Good rating (70%)' },
      { input: 50, expected: '😐', desc: 'Moderate rating (50%)' },
      { input: 30, expected: '😕', desc: 'Poor rating (30%)' },
      { input: 10, expected: '😞', desc: 'Very poor rating (10%)' }
    ];

    emojiTests.forEach(test => {
      const result = getRatingEmoji(test.input);
      const passed = result === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${test.input}% → ${result}`);
      if (!passed) allPassed = false;
    });

    // Test getDayName
    const dayTests = [
      { input: '2024-12-09', expected: 'Mon', desc: 'Monday date' },
      { input: '2024-12-10', expected: 'Tue', desc: 'Tuesday date' }
    ];

    dayTests.forEach(test => {
      const result = getDayName(test.input);
      const passed = result === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${test.input} → ${result}`);
      if (!passed) allPassed = false;
    });

    // Test getProgressBar
    const barResult = getProgressBar(75);
    const hasProgressBar = typeof barResult === 'string' && barResult.length === 10;
    console.log(`${hasProgressBar ? '✅' : '❌'} Progress bar (75%): ${barResult}`);
    if (!hasProgressBar) allPassed = false;

    console.log('━'.repeat(40));
    console.log(allPassed ? '✅ All helper tests passed!\n' : '❌ Some helper tests failed!\n');
    return allPassed;
  } catch (error) {
    console.log('❌ Failed to load helper functions from main.js:', error.message);
    console.log('━'.repeat(40));
    console.log('❌ Helper tests failed!\n');
    return false;
  }
}

(async function() {
  // Run all tests
  console.log('🚀 Running all tests...\n');
  
  const results = [];
  results.push(testDateFormatting());
  results.push(testCSVParsing());
  results.push(testErrorHandling());
  results.push(testHelperFunctions());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log('━'.repeat(50));
  console.log(`📊 Test Summary: ${passed}/${total} test suites passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!\n');
  } else {
    console.log('❌ Some tests failed!\n');
  }

  console.log('📺 Demo: main.js output format');
  console.log('😊 Clean and simple UK Green Energy Outlook');
  console.log('✅ Using facial expressions for ratings');
  console.log('');

  // Show sample output format
  console.log('🔄 Sample output format:\n');

  const sampleMessage = `🌱 **UK Green Energy Outlook**

📊 Yesterday: **67% green energy** 😊

📈 This week: **61% renewable** 😊

**Mon** 😍 85% █████████░
**Tue** 😊 72% ███████░░░
**Wed** 😊 68% ██████░░░░
**Thu** 😐 45% ████░░░░░░
**Fri** 😕 32% ███░░░░░░░
**Sat** 😊 64% ██████░░░░
**Sun** 😊 71% ███████░░░

🏆 Best: Mon (85%)
⚡ Lowest: Fri (32%)

💭 Good renewable energy week expected.`;

  console.log(sampleMessage);
  console.log('\n✅ This is the format generated by main.js in n8n');
})();