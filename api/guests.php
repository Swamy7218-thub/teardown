<?php
// Private guest list for launch no. 17. Opens only with the founder's key in the link.
declare(strict_types=1);
require __DIR__ . '/store.php';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
const KEY_SHA256 = '6ccbdbc2763bca426ba64253bc7a8d49279bd8a292c10d90b23060a5ce6d9934';
$key = (string)($_GET['key'] ?? '');
if (!hash_equals(KEY_SHA256, hash('sha256', $key))) { http_response_code(404); exit('Not found'); }

$csv = acq_csv_path();
$rows = [];
if (is_file($csv) && ($f = fopen($csv, 'r'))) { fgetcsv($f); while ($r = fgetcsv($f)) $rows[] = $r; fclose($f); }

if (isset($_GET['csv'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="acquaht-launch-17-guests.csv"');
    readfile($csv); exit;
}
$c = acq_counts();
$e = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$k = rawurlencode($key);
?><!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Launch 17 · guest list</title>
<style>body{margin:0;background:#0b0d10;color:#eef0f3;font:15px/1.5 system-ui,sans-serif;padding:24px}h1{font-size:28px;margin:0 0 4px}p{color:#9aa1ab;margin:0 0 20px}
.k{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 20px}.k div{background:#14171c;border:1px solid #262a31;border-radius:8px;padding:12px 16px}.k b{display:block;font-size:24px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #262a31}th{color:#9aa1ab;font-size:12px;text-transform:uppercase;letter-spacing:1px}
a{color:#7fb0ff}</style></head><body>
<h1>Launch no. 17 · guests</h1><p>Newest first. Only people who ticked "save me" appear here. <a href="?key=<?= $k ?>&amp;csv=1">Download CSV</a></p>
<div class="k"><div><b><?= (int)($c['open'] ?? 0) ?></b>saw the card</div><div><b><?= (int)($c['card'] ?? 0) ?></b>made a card</div><div><b><?= (int)($c['saved'] ?? 0) ?></b>saved their name</div><div><b><?= (int)($c['skip'] ?? 0) ?></b>skipped</div></div>
<table><tr><th>Time (IST)</th><th>Name</th><th>Birthday</th><th>Came from</th></tr>
<?php foreach (array_reverse($rows) as $r): ?><tr><td><?= $e($r[0] ?? '') ?></td><td><?= $e(ltrim($r[1] ?? '', "'")) ?></td><td><?= $e($r[2] ?? '') ?></td><td><?= $e(ltrim($r[3] ?? '', "'")) ?></td></tr><?php endforeach; ?>
</table><p style="margin-top:20px">Stored in: <?= $e(basename(dirname($csv)) === 'data' ? 'public_html/api/data (fallback, blocked from the web)' : 'launch-data, outside public_html') ?></p></body></html>
