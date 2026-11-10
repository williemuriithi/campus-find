<?php
/** Owner-only: mark a report as Recovered, or reopen it back to Lost/Found. */
require __DIR__ . '/../../includes/helpers.php';
require __DIR__ . '/../../includes/items.php';
require_method('POST');

run(function () {
    $user = require_login();
    $in   = input();
    $id   = (int)($in['id'] ?? 0);
    $item = $id ? find_item($id) : null;

    if (!$item || $item['reported_by'] !== (int)$user['id']) {
        fail('Could not update this report.', 403);
    }

    $reopen    = $item['status'] === 'Recovered';
    $newStatus = $reopen ? $item['kind'] : 'Recovered';

    db()->prepare('UPDATE items SET status = ?, recovered_at = ' . ($reopen ? 'NULL' : 'NOW()') . ' WHERE id = ?')
        ->execute([$newStatus, $id]);

    json_out(['ok' => true, 'item' => find_item($id)]);
});
