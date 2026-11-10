<?php
require __DIR__ . '/../../includes/helpers.php';
require_method('POST');

run(function () {
    $in    = input();
    $name  = str($in, 'full_name', 120);
    $email = strtolower(str($in, 'email', 190));
    $sid   = normalize_student_id(str($in, 'student_id', 30));
    $pass  = (string)($in['password'] ?? '');

    if ($name === '')                                   fail('Please enter your full name.', 422, ['field' => 'full_name']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))     fail('Please enter a valid email address.', 422, ['field' => 'email']);
    if (!valid_student_id($sid))                        fail('Enter your ID in this format: SC200/0000/2024.', 422, ['field' => 'student_id']);
    if (!valid_password($pass))                         fail('Password must be 8+ characters with a number or symbol.', 422, ['field' => 'password']);

    $pdo = db();

    // Is the email already used?
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) {
        fail('An account with this email already exists. Try signing in.', 409, ['field' => 'email']);
    }

    // Student ID must exist in the registry and not be used yet.
    $st = $pdo->prepare('SELECT used FROM students WHERE student_id = ?');
    $st->execute([$sid]);
    $row = $st->fetch();
    if (!$row || (int)$row['used'] === 1) {
        fail('This ID is not authorized to join, or it has already been used.', 403, ['field' => 'student_id']);
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO users (full_name, email, student_id, password_hash) VALUES (?,?,?,?)')
            ->execute([$name, $email, $sid, password_hash($pass, PASSWORD_DEFAULT)]);
        $pdo->prepare('UPDATE students SET used = 1 WHERE student_id = ?')->execute([$sid]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_out(['ok' => true, 'message' => 'Account created.'], 201);
});
