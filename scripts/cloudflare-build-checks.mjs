import assert from 'node:assert/strict';
import ts from 'typescript';

export function verifyImageDialogs(document, page) {
  const dialogs = [...document.querySelectorAll('dialog.blog-image-dialog')];
  const triggers = [...document.querySelectorAll('[data-blog-image-open]')];
  const ids = dialogs.map(dialog => dialog.id);
  assert.ok(ids.every(id => id.trim()), `${page}: image dialog must have an ID`);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate image dialog IDs`);

  const triggerCounts = new Map(ids.map(id => [id, 0]));
  for (const trigger of triggers) {
    const id = trigger.getAttribute('data-blog-image-open');
    assert.ok(id && document.getElementById(id)?.matches('dialog.blog-image-dialog'), `${page}: image trigger has no dialog`);
    assert.equal(trigger.getAttribute('aria-controls'), id, `${page}: image trigger and dialog must match`);
    triggerCounts.set(id, triggerCounts.get(id) + 1);
  }
  for (const id of ids) {
    assert.equal(triggerCounts.get(id), 1, `${page}: image dialog must have exactly one opening trigger`);
  }
}

export function verifyWorkerExport(entryPath, exportName) {
  const program = ts.createProgram([entryPath], {
    allowJs: true,
    noEmit: true,
    skipLibCheck: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    types: [],
  });
  const source = program.getSourceFile(entryPath);
  assert.ok(source, `Worker entry point not found: ${entryPath}`);
  assert.equal(program.getSyntacticDiagnostics(source).length, 0, 'Worker entry point must be valid JavaScript');
  const checker = program.getTypeChecker();
  const module = checker.getSymbolAtLocation(source);
  assert.ok(module, 'Worker entry point must be an ES module');
  assert.ok(checker.getExportsOfModule(module).some(symbol => symbol.name === exportName),
    `Worker must export ${exportName}`);
}
