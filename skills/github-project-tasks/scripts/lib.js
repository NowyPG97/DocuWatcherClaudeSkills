const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FIELD_MAP_PATH = path.join(__dirname, '..', 'reference', 'field-map.json');

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
    '--limit', '500',
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
  loadFieldMap,
  gh,
  ghJson,
  getOwnerProject,
  listItems,
  findItemByKey,
};
