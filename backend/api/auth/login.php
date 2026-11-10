<?php
require __DIR__ . '/../../includes/helpers.php';
require_method('POST');

run(function () {
    $in    = input();
    $email = strtolower(str($in, 'email', 190));
    $pass  = (string)($in['password'] ?? '');

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6) {
        fail('Incorrect email or password. Please try again or reset your password.', 401);
    }

    $st = db()->prepare('SELECT id, full_name, email, student_id, password_hash FROM users WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();

    if (!$u || !password_verify($pass, $u['password_hash'])) {
        fail('Incorrect email or password. Please try again or reset your password.', 401);
    }

    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int)$u['id'];

    unset($u['password_hash']);
    $u['id'] = (int)$u['id'];
    json_out(['ok' => true, 'user' => $u]);
});
