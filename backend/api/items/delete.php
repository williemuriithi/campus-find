<?php
/** Owner-only: delete a report. */
require __DIR__ . '/../../includes/helpers.php';
require __DIR__ . '/../../includes/items.php';
require_method('POST');

run(function () {
    $user = require_login();
    $in   = input();
    $id   = (int)($in['id'] ?? 0);

    $st = db()->prepare('DELETE FROM items WHERE id = ? AND reported_by = ?');
    $st->execute([$id, $user['id']]);
    if ($st->rowCount() === 0) {
        fail('Could not delete this report.', 403);
    }
    json_out(['ok' => true]);
});
