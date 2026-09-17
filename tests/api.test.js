import test from 'node:test';
import assert from 'node:assert/strict';
import { invoiceAmount } from '../server/database.js';

test('invoice excludes non-delivered service days', () => {
  assert.equal(invoiceAmount(3000,17,22), 2318);
});
