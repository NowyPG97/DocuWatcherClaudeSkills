const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// field-map.json jest commitowany do repo skilli — nie generuj go tylko lokalnie,
// bo plugin cache (tam, gdzie leży __dirname po instalacji) jest nadpisywany przy aktualizacji.
const FIELD_MAP_PATH = path.join(__dirname, '..', 'reference', 'field-map.json');

// Rzeczywiste opcje pola Status na tablicy NowyPG97/1 (odzwierciedlone w field-map.json).
const STATUS = {
  BACKLOG: 'Backlog',
  READY: 'Ready',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  DONE: 'Done',
};

// Pola zwykłe (ProjectV2Field) nie niosą w field-map typu danych — typ jest ustalony tutaj.
// Wbudowane pola GitHuba (Title, Assignees, Repository, Labels...) nie są edytowalne przez item-edit.
const EDITABLE_PLAIN_FIELDS = {
  Key: 'text',
  'Depends on': 'text',
  Estimate: 'number',
  'Start date': 'date',
  'Target date': 'date',
};

function sameName(a, b) {
  return (a || '').toLowerCase() === (b || '').toLowerCase();
}

function loadFieldMap() {
  if (!fs.existsSync(FIELD_MAP_PATH)) {
    throw new Error(
      `Brak ${FIELD_MAP_PATH}. Uruchom najpierw: node scripts/refresh-field-map.js`
    );
  }
  return JSON.parse(fs.readFileSync(FIELD_MAP_PATH, 'utf-8'));
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 20 });
}

function ghJson(args) {
  return JSON.parse(gh(args));
}

function getOwnerProject() {
  const owner = process.env.GH_PROJECT_OWNER || 'NowyPG97';
  const number = process.env.GH_PROJECT_NUMBER || '1';
  return { owner, number };
}

function listItems() {
  const { owner, number } = getOwnerProject();
  const data = ghJson([
    'project', 'item-list', number,
    '--owner', owner,
    '--format', 'json',
    '--limit', '1000',
  ]);
  return data.items;
}

function findItemByKey(key) {
  const items = listItems();
  const item = items.find((it) => it.key === key);
  if (!item) {
    throw new Error(`Nie znaleziono zadania o kluczu "${key}" w projekcie ${getOwnerProject().owner}/${getOwnerProject().number}.`);
  }
  return item;
}

module.exports = {
  FIELD_MAP_PATH,
  STATUS,
  EDITABLE_PLAIN_FIELDS,
  sameName,
  loadFieldMap,
  gh,
  ghJson,
  getOwnerProject,
  listItems,
  findItemByKey,
};
