<?php
// Receives the launch card. Saves name + birthday (day and month) only when the visitor ticked "save me".
// Every visit also bumps an anonymous counter (opened, skipped, card made), with no personal data.
declare(strict_types=1);
require __DIR__ . '/store.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$in = json_decode((string)file_get_contents('php://input', false, null, 0, 4096), true);
if (!is_array($in)) { http_response_code(400); echo '{"ok":false}'; exit; }

$event = (string)($in['event'] ?? '');
if ($event === 'skip' || $event === 'open') {
    acq_bump($event);
    echo '{"ok":true}'; exit;
}
if ($event !== 'card') { http_response_code(400); echo '{"ok":false}'; exit; }

// a hidden field people never see; bots fill it
if (!empty($in['website'])) { echo '{"ok":true,"n":0}'; exit; }

$name = trim(preg_replace('/[\x00-\x1F\x7F<>]/u', '', (string)($in['name'] ?? '')) ?? '');
$day = (int)($in['day'] ?? 0);
$month = (int)($in['month'] ?? 0);
if ($name === '' || mb_strlen($name) > 60 || !checkdate($month, $day, 2024)) {
    http_response_code(422); echo '{"ok":false}'; exit;
}

$counts = acq_bump('card');
$n = (int)($counts['saved'] ?? 0);

if (!empty($in['save'])) {
    $csv = acq_csv_path();
    $new = !is_file($csv);
    $f = fopen($csv, 'a');
    if ($f) {
        flock($f, LOCK_EX);
        if ($new) fputcsv($f, ['time_ist', 'name', 'birthday', 'came_from']);
        $ref = parse_url((string)($in['ref'] ?? ''), PHP_URL_HOST) ?: 'direct';
        $when = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d H:i');
        $bday = sprintf('%02d %s', $day, date('M', mktime(0, 0, 0, $month, 1, 2024)));
        fputcsv($f, [$when, acq_cell($name), $bday, acq_cell(mb_substr($ref, 0, 80))]);
        fflush($f); flock($f, LOCK_UN); fclose($f);
        $counts = acq_bump('saved');
        $n = (int)$counts['saved'];
    }
}

echo json_encode(['ok' => true, 'n' => $n, 'cards' => (int)$counts['card']]);
