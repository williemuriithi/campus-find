<?php
/** Step 3: set the new password (requires a verified code from this browser session). */
require __DIR__ . '/../../includes/helpers.php';
require_method('POST');

run(function () {
    start_session();
    $in   = input();
    $pass = (string)($in['password'] ?? '');

    $uid = $_SESSION['reset_user_id']  ?? null;
    $rid = $_SESSION['reset_reset_id'] ?? null;
    if (!$uid || !$rid) {
        fail('Your reset session has expired. Please start again.', 403);
    }
    if (!valid_password($pass)) {
        fail('Password must be 8+ characters with a number or symbol.', 422);
    }

    $pdo = db();
    $st = $pdo->prepare('SELECT id FROM password_resets WHERE id = ? AND user_id = ? AND verified = 1 AND expires_at > NOW()');
    $st->execute([$rid, $uid]);
    if (!$st->fetch()) {
        fail('Your reset session has expired. Please start again.', 403);
    }

    $st = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
    $st->execute([$uid]);
    $cur = $st->fetch();
    if ($cur && password_verify($pass, $cur['password_hash'])) {
        fail('Your new password must be different from your old one.', 422);
    }

    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($pass, PASSWORD_DEFAULT), $uid]);
    $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$uid]);

    unset($_SESSION['reset_user_id'], $_SESSION['reset_reset_id']);
    json_out(['ok' => true]);
});
