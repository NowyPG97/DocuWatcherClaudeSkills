#!/usr/bin/env node
// Aktualizuje tytuł i/lub opis zadania.
// Draft Issue (większość zadań na tablicy) -> gh project item-edit --title/--body
// Prawdziwy GitHub Issue (item.content.type === "Issue") -> gh issue edit na powiązanym URL-u
//
// Użycie:
//   node update-content.js <KEY> --title "Nowy tytuł"
//   node update-content.js <KEY> --body "Nowa treść"
//   node update-content.js <KEY> --body-file sciezka/do/pliku.md
const fs = require('fs');
const { execFileSync } = require('child_process');
const { findItemByKey } = require('./lib');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--title') out.title = argv[++i];
    else if (argv[i] === '--body') out.body = argv[++i];
    else if (argv[i] === '--body-file') out.bodyFile = argv[++i];
  }
  return out;
}

const key = process.argv[2];
const opts = parseArgs(process.argv.slice(3));

if (!key || (!opts.title && !opts.body && !opts.bodyFile)) {
  console.error('Użycie: node update-content.js <KEY> [--title "..."] [--body "..."] [--body-file plik.md]');
  process.exit(1);
}

const item = findItemByKey(key);
const isDraft = item.content && item.content.type === 'DraftIssue';
const body = opts.bodyFile ? fs.readFileSync(opts.bodyFile, 'utf-8') : opts.body;

if (isDraft) {
  // Tytuł/treść draftu edytuje mutacja updateProjectV2DraftIssue — wymaga ID draftu (DI_...),
  // nie ID pozycji w projekcie (PVTI_...).
  const args = ['project', 'item-edit', '--id', item.content.id];
  if (opts.title) args.push('--title', opts.title);
  if (body !== undefined) args.push('--body', body);
  execFileSync('gh', args, { stdio: 'inherit' });
} else {
  if (!item.content || !item.content.url) {
    console.error(`Zadanie "${key}" nie jest Draft Issue i nie ma powiązanego URL-a issue — nie da się zaktualizować treści.`);
    process.exit(1);
  }
  const args = ['issue', 'edit', item.content.url];
  if (opts.title) args.push('--title', opts.title);
  if (opts.bodyFile) args.push('--body-file', opts.bodyFile);
  else if (opts.body) args.push('--body', opts.body);
  execFileSync('gh', args, { stdio: 'inherit' });
}

console.log(`OK: zaktualizowano treść zadania ${key}`);
