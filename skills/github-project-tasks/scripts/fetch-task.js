#!/usr/bin/env node
// Pobiera świeże dane pojedynczego zadania z GitHub Projects po jego Key (np. T-01).
const { findItemByKey } = require('./lib');

const key = process.argv[2];
if (!key) {
  console.error('Użycie: node fetch-task.js <KEY>   np. node fetch-task.js T-01');
  process.exit(1);
}

try {
  const item = findItemByKey(key);
  console.log(JSON.stringify(item, null, 2));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
