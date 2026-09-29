#!/usr/bin/env node
// Zmienia pole Status zadania w GitHub Projects.
// Użycie: node set-status.js <KEY> <Backlog|Ready|"In progress"|"In review"|Done>
const { execFileSync } = require('child_process');
const { loadFieldMap, findItemByKey, sameName } = require('./lib');

const [key, statusName] = process.argv.slice(2);
if (!key || !statusName) {
  console.error('Użycie: node set-status.js <KEY> <Backlog|Ready|"In progress"|"In review"|Done>');
  process.exit(1);
}

const fieldMap = loadFieldMap();
const statusField = fieldMap.fields.find((f) => f.name === 'Status');
const option = statusField.options.find((o) => sameName(o.name, statusName));
if (!option) {
  console.error(`Nieznany status "${statusName}". Dozwolone: ${statusField.options.map((o) => o.name).join(', ')}`);
  process.exit(1);
}

const item = findItemByKey(key);

execFileSync('gh', [
  'project', 'item-edit',
  '--id', item.id,
  '--project-id', fieldMap.projectId,
  '--field-id', statusField.id,
  '--single-select-option-id', option.id,
], { stdio: 'inherit' });

console.log(`OK: ${key} -> Status = ${option.name}`);
