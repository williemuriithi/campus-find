# CampusFind – Campus Lost & Found

HTML + CSS + JavaScript frontend, PHP backend, MySQL database.

```
campusfind/
├── frontend/
│   ├── index.html                 # all pages/screens (markup only)
│   └── assets/
│       ├── css/style.css          # custom styles
│       ├── js/
│       │   ├── tailwind-config.js # Tailwind theme (colors, fonts)
│       │   ├── api.js             # fetch() calls to the PHP API
│       │   ├── utils.js           # DOM helpers, modal, toast, terms text
│       │   ├── auth.js            # sign in / sign up / forgot password
│       │   └── app.js             # home page, items, filters, report form
│       └── images/                # place for local images (see README inside)
├── backend/
│   ├── api/
│   │   ├── auth/   register.php  login.php  logout.php  me.php
│   │   │           forgot.php  verify_code.php  reset.php
│   │   └── items/  list.php  create.php  update_status.php  delete.php
│   ├── config/config.php          # DB credentials + debug flag
│   ├── includes/                  # db.php, helpers.php, items.php
│   ├── database/schema.sql        # MySQL tables + sample student IDs
│   └── storage/                   # mail.log (debug mode)
├── router.php                     # dev server router (optional)
└── README.md
```

## Setup with XAMPP / WAMP
1. Copy the `campusfind` folder into `htdocs` (XAMPP) or `www` (WAMP).
2. Start **Apache** and **MySQL**.
3. Open phpMyAdmin → **Import** → choose `backend/database/schema.sql` → Go.
4. Check `backend/config/config.php` (default user `root`, empty password).
5. Open **http://localhost/campusfind/frontend/**

## Setup with PHP's built-in server
```
mysql -u root -p < backend/database/schema.sql
php -S localhost:8000 router.php
```
Then open http://localhost:8000 (needs the `pdo_mysql` extension).

## Using it
- Sign-up only works for student IDs in the `students` table
  (samples: `SC200/0001/2024` … `SC200/0005/2024`). Add your real IDs with
  `INSERT INTO students (student_id) VALUES ('SC200/0006/2024');`
- Forgot password: with `'debug' => true` the 6-digit code is shown on screen and
  written to `backend/storage/mail.log`. Set it to `false` in production
  (the server must then be able to send mail with PHP `mail()`).

## What changed from the Supabase version
| Before (Supabase)            | Now                                           |
|------------------------------|-----------------------------------------------|
| Supabase Auth                | PHP sessions + `password_hash()` / `users` table |
| Student ID DB trigger        | `students` table checked in `register.php`    |
| `items` table + RLS          | MySQL `items` table; owner checks in PHP      |
| Emailed recovery link/code   | 6-digit code in `password_resets` (hashed, 15 min, 5 tries) |
| Email confirmation on signup | Removed – accounts work immediately           |

Security notes: all queries use PDO prepared statements, passwords are hashed,
the `config`, `includes`, `database` and `storage` folders are blocked by `.htaccess`
on Apache. Move `config.php` outside the web root if you deploy for real.
