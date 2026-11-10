<?php
require __DIR__ . '/../../includes/helpers.php';

run(function () {
    $id = current_user_id();
    if (!$id) {
        json_out(['ok' => true, 'user' => null]);
    }
    $st = db()->prepare('SELECT id, full_name, email, student_id FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if ($u) { $u['id'] = (int)$u['id']; }
    json_out(['ok' => true, 'user' => $u ?: null]);
});
