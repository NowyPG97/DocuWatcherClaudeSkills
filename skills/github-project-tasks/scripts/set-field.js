#!/usr/bin/env node
// Ustawia pole zadania w GitHub Projects (single-select, liczbowe, tekstowe lub data).
// Użycie: node set-field.js <KEY> <NazwaPola> <wartość>
const { execFileSync } = require('child_process');
const { loadFieldMap, findItemByKey, EDITABLE_PLAIN_FIELDS, sameName } = require('./lib');

const [key, fieldName, value] = process.argv.slice(2);
if (!key || !fieldName || value === undefined) {
  console.error('Użycie: node set-field.js <KEY> <NazwaPola> <wartość>');
  console.error('Pola single-select: Status, Priority, Size, Area, Codebase');
  console.error(`Pola zwykłe: ${Object.entries(EDITABLE_PLAIN_FIELDS).map(([n, t]) => `${n} (${t})`).join(', ')}`);
  console.error('Daty w formacie YYYY-MM-DD.');
  process.exit(1);
}

const fieldMap = loadFieldMap();
const field = fieldMap.fields.find((f) => sameName(f.name, fieldName));
if (!field) {
  console.error(`Nieznane pole "${fieldName}". Dostępne: ${fieldMap.fields.map((f) => f.name).join(', ')}`);
  process.exit(1);
}

const args = ['project', 'item-edit', '--project-id', fieldMap.projectId, '--field-id', field.id];

if (field.options) {
  const option = field.options.find((o) => sameName(o.name, value));
  if (!option) {
    console.error(`Nieznana wartość "${value}" dla pola "${field.name}". Dozwolone: ${field.options.map((o) => o.name).join(', ')}`);
    process.exit(1);
  }
  args.push('--single-select-option-id', option.id);
} else {
  const type = EDITABLE_PLAIN_FIELDS[field.name];
  if (!type) {
    console.error(`Pole "${field.name}" jest wbudowanym polem GitHuba i nie da się go ustawić przez item-edit.`);
    process.exit(1);
  }
  args.push(`--${type}`, value);
}

const item = findItemByKey(key);
args.push('--id', item.id);

execFileSync('gh', args, { stdio: 'inherit' });
console.log(`OK: ${key} -> ${field.name} = ${value}`);
