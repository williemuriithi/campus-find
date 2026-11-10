<?php
/**
 * Step 1 of password recovery: email a 6-digit code.
 * Always answers "ok" so attackers can't discover which emails are registered.
 */
require __DIR__ . '/../../includes/helpers.php';
require_method('POST');

run(function () {
    $in    = input();
    $email = strtolower(str($in, 'email', 190));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Please enter a valid email address.', 422);
    }

    $cfg = config();
    $pdo = db();
    $st  = $pdo->prepare('SELECT id, full_name FROM users WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();

    $debugCode = null;

    if ($u) {
        // Throttle: one code per 60 seconds per user.
        $st = $pdo->prepare('SELECT created_at FROM password_resets WHERE user_id = ? ORDER BY id DESC LIMIT 1');
        $st->execute([$u['id']]);
        $last = $st->fetch();
        if ($last && (time() - strtotime($last['created_at'])) < 60) {
            fail('Too many requests. Please wait a minute or two and try again.', 429);
        }

        $code = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $pdo->prepare('DELETE FROM password_resets WHERE user_id = ?')->execute([$u['id']]);
        $pdo->prepare('INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?,?, DATE_ADD(NOW(), INTERVAL ? MINUTE))')
            ->execute([$u['id'], password_hash($code, PASSWORD_DEFAULT), (int)$cfg['reset_code_ttl_minutes']]);

        $subject = 'Your CampusFind recovery code';
        $body    = "Hi {$u['full_name']},\r\n\r\nYour CampusFind password recovery code is: {$code}\r\n"
                 . "It expires in {$cfg['reset_code_ttl_minutes']} minutes. If you didn't ask for it, ignore this email.\r\n";
        $headers = 'From: ' . $cfg['mail_from'] . "\r\nContent-Type: text/plain; charset=utf-8";
        @mail($email, $subject, $body, $headers);

        if ($cfg['debug']) {
            $dir = __DIR__ . '/../../storage';
            if (!is_dir($dir)) @mkdir($dir, 0775, true);
            @file_put_contents($dir . '/mail.log', date('c') . " to={$email} code={$code}\n", FILE_APPEND);
            $debugCode = $code;
        }
    }

    $out = ['ok' => true];
    if ($debugCode !== null) {
        $out['debug_code'] = $debugCode;   // only in debug mode
    }
    json_out($out);
});
