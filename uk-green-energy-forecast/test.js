// Simple test for main.js
// This creates a standalone version for testing the n8n script

const fs = require('fs');

// Import formatDate from main.js to avoid code duplication
function getFunctionFromMain(functionName) {
  const mainCode = fs.readFileSync('./main.js', 'utf8');

  // Extract function from main.js with improved regex for complex definitions
  // Handles: multiline params, default params, destructuring, comments, etc.
  const funcPattern = new RegExp(
    `function\\s+${functionName}\\s*\\([^{]*?\\)\\s*\\{[\\s\\S]*?^\\}`,
    'gm'
  );
 
  const funcMatch = mainCode.match(funcPattern);
  if (!funcMatch || funcMatch.length === 0) {
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

// Test performance characteristics
function testPerformance() {
  console.log('🧪 Testing performance characteristics');
  console.log('━'.repeat(40));

  let allPassed = true;

  try {
    const parseCSV = getFunctionFromMain('parseCSV');
    const formatDate = getFunctionFromMain('formatDate');
    const getRatingEmoji = getFunctionFromMain('getRatingEmoji');
    const getProgressBar = getFunctionFromMain('getProgressBar');

    // Performance test: parseCSV with large dataset
    const largeCsvData = 'col1,col2,col3\n' + Array(1000).fill(0).map((_, i) => 
      `value${i},${i * 2},${i * 3.14159}`).join('\n');
    
    const start1 = performance.now();
    const result1 = parseCSV(largeCsvData);
    const end1 = performance.now();
    const csvTime = end1 - start1;
    
    const csvPerformanceOk = csvTime < 100 && result1.length === 1000; // Should be under 100ms
    console.log(`${csvPerformanceOk ? '✅' : '❌'} parseCSV (1000 rows): ${csvTime.toFixed(2)}ms`);
    if (!csvPerformanceOk) allPassed = false;

    // Performance test: formatDate in bulk
    const dates = ['20241209', '2024-12-09T10:30:00', 20241210, '2025-01-01T00:00:00'];
    const start2 = performance.now();
    for (let i = 0; i < 1000; i++) {
      dates.forEach(date => formatDate(date));
    }
    const end2 = performance.now();
    const dateTime = end2 - start2;

    const datePerformanceOk = dateTime < 50; // Should be under 50ms for 4000 operations
    console.log(`${datePerformanceOk ? '✅' : '❌'} formatDate (4000 ops): ${dateTime.toFixed(2)}ms`);
    if (!datePerformanceOk) allPassed = false;

    // Performance test: emoji and progress bar generation
    const start3 = performance.now();
    for (let i = 0; i <= 100; i++) {
      getRatingEmoji(i);
      getProgressBar(i);
    }
    const end3 = performance.now();
    const uiTime = end3 - start3;

    const uiPerformanceOk = uiTime < 10; // Should be under 10ms for 202 operations
    console.log(`${uiPerformanceOk ? '✅' : '❌'} UI helpers (202 ops): ${uiTime.toFixed(2)}ms`);
    if (!uiPerformanceOk) allPassed = false;

    // Memory usage test (rough estimation)
    const memBefore = process.memoryUsage().heapUsed;
    const testData = Array(100).fill(0).map(() => parseCSV('a,b,c\n1,2,3\n4,5,6'));
    const memAfter = process.memoryUsage().heapUsed;
    const memDelta = (memAfter - memBefore) / 1024 / 1024; // MB

    const memoryOk = memDelta < 5; // Should use less than 5MB
    console.log(`${memoryOk ? '✅' : '❌'} Memory usage (100 parses): ${memDelta.toFixed(2)}MB`);
    if (!memoryOk) allPassed = false;

    // Performance benchmarks summary
    console.log('\n📋 Performance Benchmarks:');
    console.log(`   • CSV parsing: ${(csvTime / 1000).toFixed(3)}ms per row`);
    console.log(`   • Date formatting: ${(dateTime / 4000).toFixed(3)}ms per operation`);
    console.log(`   • UI generation: ${(uiTime / 202).toFixed(3)}ms per operation`);
    
  } catch (error) {
    console.log(`❌ Performance tests failed: ${error.message}`);
    allPassed = false;
  }

  console.log('━'.repeat(40));
  console.log(allPassed ? '✅ All performance tests passed!\n' : '❌ Some performance tests failed!\n');
  return allPassed;
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

  // Test regex robustness with multiline function definitions 
  try {
    const calculateDailyRenewables = getFunctionFromMain('calculateDailyRenewables');
    // Test that complex multiline function can be extracted (don't execute due to dependencies)
    const isFunction = typeof calculateDailyRenewables === 'function';
    const hasCorrectName = calculateDailyRenewables.name === 'calculateDailyRenewables';
    const passed = isFunction && hasCorrectName;
    console.log(`${passed ? '✅' : '❌'} Complex multiline function extraction: ${passed ? 'working' : 'failed'}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ Complex function extraction failed: ${error.message}`);
    allPassed = false;
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

    // Test getRatingEmoji (including edge cases)
    const emojiTests = [
      { input: 90, expected: '😍', desc: 'Excellent rating (90%)' },
      { input: 80, expected: '😍', desc: 'Excellent boundary (80%)' },
      { input: 79, expected: '😊', desc: 'Good boundary (79%)' },
      { input: 70, expected: '😊', desc: 'Good rating (70%)' },
      { input: 60, expected: '😊', desc: 'Good boundary (60%)' },
      { input: 59, expected: '😐', desc: 'Moderate boundary (59%)' },
      { input: 50, expected: '😐', desc: 'Moderate rating (50%)' },
      { input: 40, expected: '😐', desc: 'Moderate boundary (40%)' },
      { input: 39, expected: '😕', desc: 'Poor boundary (39%)' },
      { input: 30, expected: '😕', desc: 'Poor rating (30%)' },
      { input: 20, expected: '😕', desc: 'Poor boundary (20%)' },
      { input: 19, expected: '😞', desc: 'Very poor boundary (19%)' },
      { input: 10, expected: '😞', desc: 'Very poor rating (10%)' },
      { input: 0, expected: '😞', desc: 'Zero rating (0%)' },
      { input: -5, expected: '😞', desc: 'Negative rating (-5%)' },
      { input: 100, expected: '😍', desc: 'Maximum rating (100%)' },
      { input: 150, expected: '😍', desc: 'Above maximum (150%)' }
    ];

    emojiTests.forEach(test => {
      const result = getRatingEmoji(test.input);
      const passed = result === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${test.input}% → ${result}`);
      if (!passed) allPassed = false;
    });

    // Test getDayName (including edge cases)
    const dayTests = [
      { input: '2024-12-09', expected: 'Mon', desc: 'Monday date' },
      { input: '2024-12-10', expected: 'Tue', desc: 'Tuesday date' },
      { input: '2024-12-11', expected: 'Wed', desc: 'Wednesday date' },
      { input: '2024-12-12', expected: 'Thu', desc: 'Thursday date' },
      { input: '2024-12-13', expected: 'Fri', desc: 'Friday date' },
      { input: '2024-12-14', expected: 'Sat', desc: 'Saturday date' },
      { input: '2024-12-15', expected: 'Sun', desc: 'Sunday date' },
      { input: '2024-01-01', expected: 'Mon', desc: 'New Year date' },
      { input: '2024-02-29', expected: 'Thu', desc: 'Leap year date' },
      { input: '2025-01-01', expected: 'Wed', desc: 'Future year date' }
    ];

    dayTests.forEach(test => {
      const result = getDayName(test.input);
      const passed = result === test.expected;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${test.input} → ${result}`);
      if (!passed) allPassed = false;
    });

    // Test getProgressBar (including edge cases)
    const progressTests = [
      { input: 0, desc: 'Empty progress (0%)', expectedLength: 10, expectedPattern: /^░{10}$/ },
      { input: 10, desc: 'Low progress (10%)', expectedLength: 10, expectedPattern: /^█░{9}$/ },
      { input: 50, desc: 'Half progress (50%)', expectedLength: 10, expectedPattern: /^█{5}░{5}$/ },
      { input: 75, desc: 'High progress (75%)', expectedLength: 10, expectedPattern: /^█{7,8}░{2,3}$/ },
      { input: 100, desc: 'Full progress (100%)', expectedLength: 10, expectedPattern: /^█{10}$/ }
    ];

    progressTests.forEach(test => {
      const result = getProgressBar(test.input);
      const lengthOk = result.length === test.expectedLength;
      const patternOk = test.expectedPattern.test(result);
      const passed = lengthOk && patternOk;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${result}`);
      if (!passed) allPassed = false;
    });

    // Test edge cases (now handled gracefully)
    const edgeTests = [
      { input: -10, desc: 'Negative progress (-10%)', expectedLength: 10, expectedPattern: /^░{10}$/ },
      { input: 150, desc: 'Over progress (150%)', expectedLength: 10, expectedPattern: /^█{10}$/ }
    ];

    edgeTests.forEach(test => {
      const result = getProgressBar(test.input);
      const lengthOk = result.length === test.expectedLength;
      const patternOk = test.expectedPattern.test(result);
      const passed = lengthOk && patternOk;
      console.log(`${passed ? '✅' : '❌'} ${test.desc}: ${result}`);
      if (!passed) allPassed = false;
    });

    // Test custom width parameter
    const customWidth = getProgressBar(50, 20);
    const customWidthOk = customWidth.length === 20;
    console.log(`${customWidthOk ? '✅' : '❌'} Custom width (50%, 20): ${customWidth}`);
    if (!customWidthOk) allPassed = false;

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
  // Run all tests with timing
  const overallStart = performance.now();
  console.log('🚀 Running all tests...\n');
 
  const results = [];
  results.push(testDateFormatting());
  results.push(testCSVParsing());
  results.push(testPerformance());
  results.push(testErrorHandling());
  results.push(testHelperFunctions());
 
  const overallEnd = performance.now();
  const totalTime = overallEnd - overallStart;
 
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log('━'.repeat(50));
  console.log(`📊 Test Summary: ${passed}/${total} test suites passed`);
  console.log(`⏱️  Total execution time: ${totalTime.toFixed(2)}ms`);
 
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

📈 This week: **61% renewable** 😊

\`Mon 😍  85% █████████░\`
\`Tue 😊  72% ███████░░░\`
\`Wed 😊  68% ██████░░░░\`
\`Thu 😐  45% ████░░░░░░\`
\`Fri 😕  32% ███░░░░░░░\`
\`Sat 😊  64% ██████░░░░\`
\`Sun 😊  71% ███████░░░\`

🏆 Best: Mon (85%)
⚡ Lowest: Fri (32%)

💭 Good renewable energy week expected.`;

  console.log(sampleMessage);
  console.log('\n✅ This is the format generated by main.js in n8n');
})();