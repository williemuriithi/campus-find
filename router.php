<?php
/**
 * Dev router for PHP's built-in server (no XAMPP needed):
 *     php -S localhost:8000 router.php
 * /api/...  -> backend/api/...      everything else -> frontend/
 */
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (strpos($path, '/api/') === 0) {
    $file = realpath(__DIR__ . '/backend' . $path);
    if ($file && strpos($file, realpath(__DIR__ . '/backend/api')) === 0 && is_file($file)) {
        require $file;
        return true;
    }
    http_response_code(404);
    header('Content-Type: application/json');
    echo '{"ok":false,"error":"Not found"}';
    return true;
}

$file = realpath(__DIR__ . '/frontend' . ($path === '/' ? '/index.html' : $path));
if ($file && strpos($file, realpath(__DIR__ . '/frontend')) === 0 && is_file($file)) {
    $types = ['html'=>'text/html','css'=>'text/css','js'=>'application/javascript','png'=>'image/png','jpg'=>'image/jpeg','svg'=>'image/svg+xml'];
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$ext] ?? 'application/octet-stream'));
    readfile($file);
    return true;
}
http_response_code(404);
echo 'Not found';
return true;
