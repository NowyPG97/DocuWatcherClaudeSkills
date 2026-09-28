#!/usr/bin/env node
// Listuje zadania z projektu, opcjonalnie filtrując po statusie.
// Użycie: node list-tasks.js [Todo|"In Progress"|Done]
const { listItems } = require('./lib');

const statusFilter = process.argv[2];

let items = listItems();
if (statusFilter) {
  items = items.filter((it) => (it.status || '').toLowerCase() === statusFilter.toLowerCase());
}

const summary = items.map((it) => ({
  key: it.key,
  title: it.title,
  status: it.status,
  priority: it.priority,
  area: it.area,
  repository: it.repository,
}));

console.log(JSON.stringify(summary, null, 2));
console.error(`\n${summary.length} zadań${statusFilter ? ` (status: ${statusFilter})` : ''}`);
