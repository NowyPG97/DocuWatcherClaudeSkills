#!/usr/bin/env node
// Sprawdza, czy zadanie jest gotowe do rozpoczęcia pracy: status = Backlog lub Ready
// i wszystkie zależności (pole "Depends on") mają status Done.
// Użycie: node check-readiness.js <KEY>
// Exit code: 0 = gotowe, 2 = niegotowe (zablokowane/zajęte/w review/zrobione), 1 = błąd użycia/nie znaleziono.
const { listItems, STATUS, sameName } = require('./lib');

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
  .filter(({ task }) => !task || !sameName(task.status, STATUS.DONE))
  .map(({ key: depKey, task }) => ({ key: depKey, status: task ? task.status : 'unknown (brak w projekcie)' }));

const startable = sameName(item.status, STATUS.BACKLOG) || sameName(item.status, STATUS.READY);

let reason = null;
if (sameName(item.status, STATUS.IN_PROGRESS)) reason = 'already_in_progress';
else if (sameName(item.status, STATUS.IN_REVIEW)) reason = 'in_review';
else if (sameName(item.status, STATUS.DONE)) reason = 'already_done';
else if (!startable) reason = `unknown_status:${item.status}`;
else if (blockedBy.length > 0) reason = 'blocked_by_dependencies';

const result = {
  key: item.key,
  title: item.title,
  status: item.status,
  dependencies: deps,
  blockedBy,
  ready: reason === null,
  reason,
};

console.log(JSON.stringify(result, null, 2));
process.exit(result.ready ? 0 : 2);
