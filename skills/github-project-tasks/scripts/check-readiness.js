#!/usr/bin/env node
// Sprawdza, czy zadanie jest gotowe do rozpoczęcia pracy: status = Todo
// i wszystkie zależności (pole "Depends on") mają status Done.
// Użycie: node check-readiness.js <KEY>
// Exit code: 0 = gotowe, 2 = niegotowe (zablokowane/zajęte/zrobione), 1 = błąd użycia/nie znaleziono.
const { listItems } = require('./lib');

const key = process.argv[2];
if (!key) {
  console.error('Użycie: node check-readiness.js <KEY>');
  process.exit(1);
}

const items = listItems();
const byKey = new Map(items.filter((it) => it.key).map((it) => [it.key, it]));
const item = byKey.get(key);

if (!item) {
  console.log(JSON.stringify({ key, ready: false, reason: 'not_found' }, null, 2));
  process.exit(1);
}

const deps = (item['depends on'] || '')
  .split(/[,;\n]/)
  .map((s) => s.trim())
  .filter(Boolean);

const blockedBy = deps
  .map((depKey) => ({ key: depKey, task: byKey.get(depKey) }))
  .filter(({ task }) => !task || task.status !== 'Done')
  .map(({ key: depKey, task }) => ({ key: depKey, status: task ? task.status : 'unknown (brak w projekcie)' }));

let reason = null;
if (item.status === 'In Progress') reason = 'already_in_progress';
else if (item.status === 'Done') reason = 'already_done';
else if (blockedBy.length > 0) reason = 'blocked_by_dependencies';

const result = {
  key: item.key,
  title: item.title,
  status: item.status,
  dependencies: deps,
  blockedBy,
  ready: item.status === 'Todo' && blockedBy.length === 0,
  reason,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ready ? 0 : 2);
