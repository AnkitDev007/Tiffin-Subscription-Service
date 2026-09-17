import test from 'node:test';
import assert from 'node:assert/strict';
import { invoice } from '../server/store.js';

test('invoice excludes non-delivered service days', () => {
  const result = invoice({ monthlyPrice: 3000, deliveredDays: 17 }, 22);
  assert.equal(result.invoiceAmount, 2318);
});
