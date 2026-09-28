#!/usr/bin/env node
// Ustawia dowolne pole zadania w GitHub Projects (single-select, liczbowe lub tekstowe/data).
// Użycie: node set-field.js <KEY> <NazwaPola> <wartość>
const { execFileSync } = require('child_process');
const { loadFieldMap, findItemByKey } = require('./lib');

const [key, fieldName, value] = process.argv.slice(2);
if (!key || !fieldName || value === undefined) {
  console.error('Użycie: node set-field.js <KEY> <NazwaPola> <wartość>');
  console.error('Pola single-select: Status, Priority, Area, Repository, Type');
  console.error('Pola liczbowe: Estimate');
  console.error('Pola dat (YYYY-MM-DD): Start, Target');
  process.exit(1);
}

const fieldMap = loadFieldMap();
const field = fieldMap.fields.find((f) => f.name.toLowerCase() === fieldName.toLowerCase());
if (!field) {
  console.error(`Nieznane pole "${fieldName}". Dostępne: ${fieldMap.fields.map((f) => f.name).join(', ')}`);
  process.exit(1);
}

const item = findItemByKey(key);
const args = ['project', 'item-edit', '--id', item.id, '--project-id', fieldMap.projectId, '--field-id', field.id];

if (field.options) {
  const option = field.options.find((o) => o.name.toLowerCase() === value.toLowerCase());
  if (!option) {
    console.error(`Nieznana wartość "${value}" dla pola "${field.name}". Dozwolone: ${field.options.map((o) => o.name).join(', ')}`);
    process.exit(1);
  }
  args.push('--single-select-option-id', option.id);
} else if (['Estimate'].includes(field.name)) {
  args.push('--number', value);
} else if (['Start', 'Target'].includes(field.name)) {
  args.push('--date', value);
} else {
  args.push('--text', value);
}

execFileSync('gh', args, { stdio: 'inherit' });
console.log(`OK: ${key} -> ${field.name} = ${value}`);
