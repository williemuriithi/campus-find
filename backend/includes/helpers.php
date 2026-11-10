<?php
/**
 * Shared helpers: JSON responses, input parsing, sessions, auth guard.
 * Every API endpoint starts with:  require __DIR__ . '/../../includes/helpers.php';
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Same-origin by default. If you host the frontend on another origin, edit these.
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 14,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => !empty($_SERVER['HTTPS']),
        ]);
        session_start();
    }
}

function json_out(array $data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): void
{
    json_out(array_merge(['ok' => false, 'error' => $message], $extra), $status);
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        fail('Method not allowed.', 405);
    }
}

/** Parse a JSON request body (falls back to form data). */
function input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw !== '' && $raw !== false) {
        $data = json_decode($raw, true);
        if (is_array($data)) {
            return $data;
        }
    }
    return $_POST;
}

function str(array $in, string $key, int $max = 255): string
{
    $v = isset($in[$key]) ? trim((string)$in[$key]) : '';
    return mb_substr($v, 0, $max);
}

function normalize_student_id(string $v): string
{
    return strtoupper(preg_replace('/\s+/', '', $v));
}

function valid_student_id(string $v): bool
{
    return (bool)preg_match('#^[A-Z]{2}\d{3}/\d{4}/\d{4}$#', $v);
}

function valid_password(string $p): bool
{
    return strlen($p) >= 8 && preg_match('/[\d\W_]/', $p);
}

function current_user_id(): ?int
{
    start_session();
    return isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
}

/** Returns the signed-in user row or ends the request with 401. */
function require_login(): array
{
    $id = current_user_id();
    if (!$id) {
        fail('Please sign in.', 401);
    }
    $st = db()->prepare('SELECT id, full_name, email, student_id FROM users WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    if (!$u) {
        unset($_SESSION['user_id']);
        fail('Please sign in.', 401);
    }
    return $u;
}

/** Wrap an endpoint body so DB errors become clean JSON instead of HTML. */
function run(callable $fn): void
{
    try {
        $fn();
    } catch (PDOException $e) {
        $msg = config()['debug'] ? 'Database error: ' . $e->getMessage() : 'Server error. Please try again.';
        fail($msg, 500);
    } catch (Throwable $e) {
        fail(config()['debug'] ? $e->getMessage() : 'Server error. Please try again.', 500);
    }
}
