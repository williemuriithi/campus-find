<?php
require __DIR__ . '/../../includes/helpers.php';
require __DIR__ . '/../../includes/items.php';
require_method('POST');

run(function () {
    $user = require_login();
    $in   = input();

    $kind     = ($in['kind'] ?? '') === 'Found' ? 'Found' : 'Lost';
    $title    = str($in, 'title', 120);
    $category = str($in, 'category', 60);
    $building = str($in, 'building', 60);
    $spot     = str($in, 'location_detail', 120);
    $date     = str($in, 'incident_date', 10);
    $desc     = str($in, 'description', 1000);

    if (mb_strlen($title) < 2)                    fail('Please enter what the item is.', 422);
    if (!in_array($category, CATEGORIES, true))   fail('Please choose a category.', 422);
    if (!in_array($building, BUILDINGS, true))    fail('Please choose a location.', 422);
    $d = DateTime::createFromFormat('Y-m-d', $date);
    if (!$d || $d->format('Y-m-d') !== $date || $date > date('Y-m-d')) {
        fail('Please enter a valid date (not in the future).', 422);
    }
    if (mb_strlen($desc) < 5)                     fail('Please add a short description (at least 5 characters).', 422);

    $pdo = db();
    $pdo->prepare('INSERT INTO items (kind, status, title, category, building, location_detail, incident_date, description, reported_by)
                   VALUES (?,?,?,?,?,?,?,?,?)')
        ->execute([$kind, $kind, $title, $category, $building, $spot !== '' ? $spot : null, $date, $desc, $user['id']]);

    $id  = (int)$pdo->lastInsertId();
    $ref = 'CF-' . str_pad((string)$id, 4, '0', STR_PAD_LEFT);
    $pdo->prepare('UPDATE items SET ref = ? WHERE id = ?')->execute([$ref, $id]);

    json_out(['ok' => true, 'item' => find_item($id)], 201);
});
