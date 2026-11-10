<?php
/**
 * CampusFind - configuration.
 * Change these values to match your XAMPP / WAMP / hosting setup.
 */

return [
    'db' => [
        'host'    => '127.0.0.1',
        'port'    => 3306,
        'name'    => 'campusfind',
        'user'    => 'root',
        'pass'    => '',          // XAMPP default is an empty password
        'charset' => 'utf8mb4',
    ],

    // true  = password-reset codes are also written to backend/storage/mail.log
    //         and returned to the browser (so you can test without a mail server).
    // false = production: codes are only sent by email.
    'debug' => true,

    'mail_from' => 'no-reply@campusfind.local',

    'reset_code_ttl_minutes' => 15,
    'reset_max_attempts'     => 5,
];
