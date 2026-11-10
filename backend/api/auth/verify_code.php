<?php
/** Step 2: check the 6-digit code. On success the browser session is allowed to set a new password. */
require __DIR__ . '/../../includes/helpers.php';
require_method('POST');

run(function () {
    $in    = input();
    $email = strtolower(str($in, 'email', 190));
    $code  = preg_replace('/\D/', '', (string)($in['code'] ?? ''));
    $bad   = 'That code is incorrect or has expired. Check the code, or request a new one.';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($code) !== 6) {
        fail($bad, 400);
    }

    $cfg = config();
    $pdo = db();
    $st  = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u) fail($bad, 400);

    $st = $pdo->prepare('SELECT * FROM password_resets WHERE user_id = ? AND expires_at > NOW() ORDER BY id DESC LIMIT 1');
    $st->execute([$u['id']]);
    $r = $st->fetch();
    if (!$r || (int)$r['attempts'] >= (int)$cfg['reset_max_attempts']) fail($bad, 400);

    if (!password_verify($code, $r['code_hash'])) {
        $pdo->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?')->execute([$r['id']]);
        fail($bad, 400);
    }

    $pdo->prepare('UPDATE password_resets SET verified = 1 WHERE id = ?')->execute([$r['id']]);
    start_session();
    $_SESSION['reset_user_id']  = (int)$u['id'];
    $_SESSION['reset_reset_id'] = (int)$r['id'];

    json_out(['ok' => true]);
});
