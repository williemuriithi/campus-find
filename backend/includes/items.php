<?php
/** Shared item helpers. */

const CATEGORIES = [
    'Phones & Electronics', 'Student IDs & Cards', 'Bags & Backpacks', 'Keys',
    'Books & Stationery', 'Clothing & Accessories', 'Wallets & Personal Items', 'Other Items',
];
const BUILDINGS = [
    'Main Library', 'Student Union', 'Science Complex', 'Engineering Hall',
    'Dining Center', 'Athletic Center', 'Central Bus Stop',
];

const ITEM_SELECT = 'SELECT i.id, i.ref, i.kind, i.status, i.title, i.category, i.building,
        i.location_detail, i.incident_date, i.description, i.reported_by,
        u.full_name AS reporter_name, u.email AS reporter_email
    FROM items i JOIN users u ON u.id = i.reported_by';

function format_item(array $r): array
{
    return [
        'id'              => (int)$r['id'],
        'ref'             => $r['ref'],
        'kind'            => $r['kind'],
        'status'          => $r['status'],
        'title'           => $r['title'],
        'category'        => $r['category'],
        'building'        => $r['building'],
        'location_detail' => $r['location_detail'],
        'incident_date'   => $r['incident_date'],
        'description'     => $r['description'],
        'reported_by'     => (int)$r['reported_by'],
        'reporter_name'   => $r['reporter_name'],
        'reporter_email'  => $r['reporter_email'],
    ];
}

function find_item(int $id): ?array
{
    $st = db()->prepare(ITEM_SELECT . ' WHERE i.id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    return $r ? format_item($r) : null;
}
