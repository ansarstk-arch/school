/**
 * Fee Module Test Script
 * 
 * Tests all fee module functionality to verify fixes
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, 'database', 'school.db');

function testFeeModule() {
  console.log('🧪 Testing Fee Module Functionality\n');
  console.log('='.repeat(60));

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = ON');

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Check unique constraint exists
  console.log('\n📋 Test 1: Unique Constraint Verification');
  try {
    const indexes = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='index' AND name='idx_fee_payments_unique'
    `).all();

    if (indexes.length > 0) {
      console.log('✅ PASS: Unique constraint exists');
      console.log(`   Index: ${indexes[0].name}`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Unique constraint not found');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 2: Check fee_payments table structure
  console.log('\n📋 Test 2: Fee Payments Table Structure');
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(fee_payments)`).all();
    const requiredColumns = [
      'id', 'receipt_no', 'student_id', 'enrollment_type', 
      'month', 'academic_year', 'amount', 'paid', 'status', 
      'date', 'collected_by', 'notes'
    ];

    const existingColumns = tableInfo.map(col => col.name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length === 0) {
      console.log('✅ PASS: All required columns exist');
      console.log(`   Total columns: ${tableInfo.length}`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Missing columns:', missingColumns.join(', '));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 3: Check for duplicate payments
  console.log('\n📋 Test 3: Duplicate Payment Detection');
  try {
    const duplicates = db.prepare(`
      SELECT student_id, enrollment_type, month, academic_year, COUNT(*) as count
      FROM fee_payments
      GROUP BY student_id, enrollment_type, month, academic_year
      HAVING COUNT(*) > 1
    `).all();

    if (duplicates.length === 0) {
      console.log('✅ PASS: No duplicate payments found');
      passedTests++;
    } else {
      console.log(`❌ FAIL: Found ${duplicates.length} duplicate payment groups`);
      duplicates.forEach(dup => {
        console.log(`   - Student ${dup.student_id}, ${dup.enrollment_type}, ${dup.month}: ${dup.count} payments`);
      });
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 4: Check payment status values
  console.log('\n📋 Test 4: Payment Status Values');
  try {
    const statuses = db.prepare(`
      SELECT DISTINCT status FROM fee_payments
    `).all();

    const validStatuses = ['Paid', 'Partial', 'Unpaid'];
    const invalidStatuses = statuses.filter(s => !validStatuses.includes(s.status));

    if (invalidStatuses.length === 0) {
      console.log('✅ PASS: All payment statuses are valid');
      console.log(`   Statuses found: ${statuses.map(s => s.status).join(', ')}`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Invalid statuses found:', invalidStatuses.map(s => s.status).join(', '));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 5: Check enrollment type values
  console.log('\n📋 Test 5: Enrollment Type Values');
  try {
    const types = db.prepare(`
      SELECT DISTINCT enrollment_type FROM fee_payments
    `).all();

    const validTypes = ['School', 'Center', 'Madrasa'];
    const invalidTypes = types.filter(t => !validTypes.includes(t.enrollment_type));

    if (invalidTypes.length === 0) {
      console.log('✅ PASS: All enrollment types are valid');
      console.log(`   Types found: ${types.map(t => t.enrollment_type).join(', ')}`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Invalid types found:', invalidTypes.map(t => t.enrollment_type).join(', '));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 6: Check receipt number uniqueness
  console.log('\n📋 Test 6: Receipt Number Uniqueness');
  try {
    const duplicateReceipts = db.prepare(`
      SELECT receipt_no, COUNT(*) as count
      FROM fee_payments
      GROUP BY receipt_no
      HAVING COUNT(*) > 1
    `).all();

    if (duplicateReceipts.length === 0) {
      console.log('✅ PASS: All receipt numbers are unique');
      passedTests++;
    } else {
      console.log(`❌ FAIL: Found ${duplicateReceipts.length} duplicate receipt numbers`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 7: Check payment calculations
  console.log('\n📋 Test 7: Payment Status Calculations');
  try {
    const payments = db.prepare(`
      SELECT id, amount, paid, status
      FROM fee_payments
      LIMIT 10
    `).all();

    let calculationErrors = 0;
    payments.forEach(payment => {
      const expectedStatus = payment.paid >= payment.amount ? 'Paid' :
                            payment.paid > 0 ? 'Partial' : 'Unpaid';
      if (payment.status !== expectedStatus) {
        console.log(`   ⚠️  Payment ${payment.id}: Expected ${expectedStatus}, got ${payment.status}`);
        calculationErrors++;
      }
    });

    if (calculationErrors === 0) {
      console.log('✅ PASS: All payment statuses calculated correctly');
      console.log(`   Checked ${payments.length} payments`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: Found ${calculationErrors} calculation errors`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 8: Check foreign key relationships
  console.log('\n📋 Test 8: Foreign Key Relationships');
  try {
    const orphanedPayments = db.prepare(`
      SELECT fp.id, fp.student_id
      FROM fee_payments fp
      LEFT JOIN students s ON fp.student_id = s.id
      WHERE s.id IS NULL
    `).all();

    if (orphanedPayments.length === 0) {
      console.log('✅ PASS: All payments have valid student references');
      passedTests++;
    } else {
      console.log(`❌ FAIL: Found ${orphanedPayments.length} orphaned payments`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 9: Check date formats
  console.log('\n📋 Test 9: Date Format Validation');
  try {
    const invalidDates = db.prepare(`
      SELECT id, date, month, academic_year
      FROM fee_payments
      WHERE date NOT LIKE '____-__-__'
         OR month NOT LIKE '____-__'
         OR academic_year NOT LIKE '____'
    `).all();

    if (invalidDates.length === 0) {
      console.log('✅ PASS: All dates are in correct format');
      passedTests++;
    } else {
      console.log(`❌ FAIL: Found ${invalidDates.length} invalid date formats`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  // Test 10: Check indexes
  console.log('\n📋 Test 10: Index Verification');
  try {
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='fee_payments'
    `).all();

    const requiredIndexes = [
      'idx_fees_student',
      'idx_fees_month',
      'idx_fees_status',
      'idx_fees_year',
      'idx_fee_payments_unique'
    ];

    const existingIndexNames = indexes.map(idx => idx.name);
    const missingIndexes = requiredIndexes.filter(idx => !existingIndexNames.includes(idx));

    if (missingIndexes.length === 0) {
      console.log('✅ PASS: All required indexes exist');
      console.log(`   Total indexes: ${indexes.length}`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Missing indexes:', missingIndexes.join(', '));
      failedTests++;
    }
  } catch (error) {
    console.log('❌ FAIL:', error.message);
    failedTests++;
  }

  db.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Fee module is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

testFeeModule();
