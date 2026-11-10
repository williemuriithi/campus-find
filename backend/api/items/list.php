<?php
require __DIR__ . '/../../includes/helpers.php';
require __DIR__ . '/../../includes/items.php';

run(function () {
    require_login();
    $rows = db()->query(ITEM_SELECT . ' ORDER BY i.created_at DESC, i.id DESC')->fetchAll();
    json_out(['ok' => true, 'items' => array_map('format_item', $rows)]);
});
