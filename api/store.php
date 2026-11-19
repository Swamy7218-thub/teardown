<?php
// Where launch-card entries live: a folder outside public_html, so web visitors can't open it
// and a redeploy from Git can't wipe it. Falls back to api/data (blocked by .htaccess) only if needed.
function acq_data_dir(): string {
    $outside = dirname(__DIR__, 2) . '/launch-data';
    if (is_dir($outside) || @mkdir($outside, 0700, true)) {
        if (is_writable($outside)) return $outside;
    }
    $inside = __DIR__ . '/data';
    if (!is_dir($inside)) @mkdir($inside, 0700, true);
    return $inside;
}

function acq_csv_path(): string { return acq_data_dir() . '/launch-17-guests.csv'; }
function acq_count_path(): string { return acq_data_dir() . '/launch-17-counts.json'; }

// A value that starts with = + - @ could run as a formula when the file is opened in Excel or Sheets.
function acq_cell(string $v): string {
    return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
}

function acq_bump(string $key): array {
    $p = acq_count_path();
    $f = fopen($p, 'c+');
    if (!$f) return [];
    flock($f, LOCK_EX);
    $raw = stream_get_contents($f);
    $c = json_decode($raw ?: '{}', true) ?: [];
    $c[$key] = ($c[$key] ?? 0) + 1;
    ftruncate($f, 0); rewind($f);
    fwrite($f, json_encode($c));
    fflush($f); flock($f, LOCK_UN); fclose($f);
    return $c;
}

function acq_counts(): array {
    $p = acq_count_path();
    return is_file($p) ? (json_decode((string)file_get_contents($p), true) ?: []) : [];
}
