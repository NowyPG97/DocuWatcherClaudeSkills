#!/usr/bin/env node
// Regeneruje reference/field-map.json na podstawie aktualnej konfiguracji projektu.
// Uruchom raz na starcie (projekt jeszcze nie ma pól niestandardowych) oraz zawsze,
// gdy w projekcie dodano/zmieniono pole albo opcję statusu.
const fs = require('fs');
const { ghJson, getOwnerProject, FIELD_MAP_PATH } = require('./lib');

const { owner, number } = getOwnerProject();

const projectData = ghJson(['project', 'list', '--owner', owner, '--format', 'json']);
const project = projectData.projects.find((p) => String(p.number) === String(number));
if (!project) {
  console.error(`Nie znaleziono projektu nr ${number} dla ${owner}`);
  process.exit(1);
}

const fieldsData = ghJson(['project', 'field-list', String(number), '--owner', owner, '--format', 'json']);

const out = {
  generatedAt: new Date().toISOString(),
  owner,
  projectNumber: Number(number),
  projectId: project.id,
  fields: fieldsData.fields,
};

fs.writeFileSync(FIELD_MAP_PATH, JSON.stringify(out, null, 2), 'utf-8');
console.log(`Zapisano ${FIELD_MAP_PATH} (${out.fields.length} pól)`);
