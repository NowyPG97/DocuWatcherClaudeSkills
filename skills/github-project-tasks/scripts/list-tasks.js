#!/usr/bin/env node
// Listuje zadania z projektu, opcjonalnie filtrując po statusie.
// Użycie: node list-tasks.js [Backlog|Ready|"In progress"|"In review"|Done]
const { listItems, sameName } = require('./lib');

const statusFilter = process.argv[2];

let items = listItems();
if (statusFilter) {
  items = items.filter((it) => sameName(it.status, statusFilter));
}

const summary = items.map((it) => ({
  key: it.key,
  title: it.title,
  status: it.status,
  priority: it.priority,
  size: it.size,
  area: it.area,
  codebase: it.codebase,
}));

console.log(JSON.stringify(summary, null, 2));
console.error(`\n${summary.length} zadań${statusFilter ? ` (status: ${statusFilter})` : ''}`);
