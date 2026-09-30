<?php
// Password endpoint for AI agents that can fetch a URL but can't run the page:
//   GET https://asimplepassword.com/api/password?words=3&sep=-&number=1&max=&memorable=0&lang=en&format=text
// Same rules and same word lists as the page (gen.js, words-*.js, memo-*.js); randomness
// from random_int() (the OS CSPRNG). Unlike the page, this runs on our server: nothing is
// stored and the password is never written to a log (the URL only carries the options).
// Keep it in step with site/gen.js: planWords, split, generate, generateMemorable.
ini_set('display_errors', '0');

const MIN_WORD = 3;
const MAX_WORD = 8;

$q = $_GET;
$format = (($q['format'] ?? 'text') === 'json') ? 'json' : 'text';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . ($format === 'json' ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8'));

function fail(string $format, string $msg, int $status = 400): void {
    http_response_code($status);
    echo $format === 'json' ? json_encode(['error' => $msg]) . "\n" : "error: $msg\n";
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') { header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS'); http_response_code(204); exit; }
if ($method !== 'GET' && $method !== 'HEAD') { header('Allow: GET, HEAD, OPTIONS'); fail($format, 'use GET', 405); }

function flag(array $q, string $key, bool $default, string $format): bool {
    if (!isset($q[$key])) return $default;
    $v = strtolower((string)$q[$key]);
    if (in_array($v, ['1', 'true', 'yes'], true)) return true;
    if (in_array($v, ['0', 'false', 'no'], true)) return false;
    fail($format, "$key must be 1 or 0");
    return $default;
}

$lang = (string)($q['lang'] ?? 'en');
if (!in_array($lang, ['en', 'es', 'pt'], true)) fail($format, 'lang must be en, es or pt');

$words = (string)($q['words'] ?? '3');
if (!preg_match('/^[2-5]$/', $words)) fail($format, 'words must be 2, 3, 4 or 5');
$words = (int)$words;

$sep = '-';
if (isset($q['sep'])) {
    $sep = (string)$q['sep'];
    if ($sep === 'none') $sep = '';
    if (mb_strlen($sep) > 3 || preg_match('/[\p{L}\p{N}\p{C}\s]/u', $sep)) fail($format, 'sep must be up to 3 symbols, no letters, digits or spaces (empty or "none" for no separator)');
}

$number = flag($q, 'number', true, $format);
$memorable = flag($q, 'memorable', false, $format);

$max = 0;
if (isset($q['max']) && $q['max'] !== '') {
    if (!preg_match('/^\d{1,2}$/', (string)$q['max']) || (int)$q['max'] < 1) fail($format, 'max must be a number from 1 to 99');
    $max = (int)$q['max'];
}

function load_words(string $lang): array {
    $src = (string)file_get_contents(dirname(__DIR__) . "/words-$lang.js");
    preg_match_all('/\b([3-8]):\s*`([^`]*)`/', $src, $m, PREG_SET_ORDER);
    $pools = [];
    foreach ($m as $x) $pools[(int)$x[1]] = preg_split('/\s+/', trim($x[2]));
    return $pools;
}

function load_memo(string $lang): array {
    $src = (string)file_get_contents(dirname(__DIR__) . "/memo-$lang.js");
    preg_match('/order:\s*(\{[^}]*\})/', $src, $o);
    $memo = ['order' => json_decode($o[1], true)];
    foreach (['N', 'V', 'A'] as $c) {
        preg_match('/\b' . $c . ':\s*`([^`]*)`/', $src, $m);
        $memo[$c] = [];
        foreach (preg_split('/\s+/', trim($m[1])) as $w) $memo[$c][mb_strlen($w)][] = $w;
    }
    return $memo;
}

// Spread $total letters over $k words as evenly as possible, with a little random variation.
function split_letters(int $total, int $k): array {
    $base = intdiv($total, $k);
    $rem = $total - $base * $k;
    $out = array_fill(0, $k, $base);
    $idx = range(0, $k - 1);
    for ($r = 0; $r < $rem; $r++) {
        $j = $r + random_int(0, $k - $r - 1);
        [$idx[$r], $idx[$j]] = [$idx[$j], $idx[$r]];
        $out[$idx[$r]]++;
    }
    for ($p = 0; $p < $k; $p++) {
        $a = random_int(0, $k - 1);
        $b = random_int(0, $k - 1);
        if ($a !== $b && random_int(0, 1) && $out[$a] > MIN_WORD && $out[$b] < MAX_WORD && $out[$a] > $out[$b]) { $out[$a]--; $out[$b]++; }
    }
    return $out;
}

function too_short(string $format, int $n): void {
    fail($format, "with these options the shortest possible password is $n characters");
}

function generate_plain(array $pools, int $k, string $sep, bool $num, int $max, string $format): string {
    $n = $num ? 1 : 0;
    $fixed = mb_strlen($sep) * ($k - 1 + $n) + $n;
    $letters = 5 * $k;
    if ($max && $letters + $fixed > $max) {
        $letters = $max - $fixed;
        if ($letters < MIN_WORD * $k) too_short($format, MIN_WORD * $k + $fixed);
    }
    $lengths = $letters === 5 * $k ? array_fill(0, $k, 5) : split_letters($letters, $k);
    $used = [];
    $parts = [];
    foreach ($lengths as $i => $len) {
        $list = $pools[$len];
        $tries = 0;
        do { $w = $list[random_int(0, count($list) - 1)]; } while (isset($used[$w]) && ++$tries < 50);
        $used[$w] = true;
        $parts[] = $i % 2 ? mb_strtoupper($w) : $w;
    }
    $pw = implode($sep, $parts);
    if ($n) $pw .= $sep . random_int(0, 9);
    return $pw;
}

// Memorable mode: words fill grammar slots (N noun, V verb, A adjective); a max length is
// met by counting the combinations that fit, so every fitting combination is equally likely.
function generate_memorable(array $memo, int $k, string $sep, bool $num, int $max, string $format): string {
    $order = str_split($memo['order'][(string)$k]);
    $kk = count($order);
    $n = $num ? 1 : 0;
    $fixed = mb_strlen($sep) * ($kk - 1 + $n) + $n;
    $budget = min($max ? $max - $fixed : PHP_INT_MAX, MAX_WORD * $kk);
    $slots = [];
    foreach ($order as $c) $slots[] = $memo[$c];

    $top = max($budget, 0);
    $ways = [$kk => array_fill(0, $top + 1, 1)];
    for ($i = $kk - 1; $i >= 0; $i--) {
        $ways[$i] = [];
        for ($b = 0; $b <= $top; $b++) {
            $total = 0;
            for ($L = MIN_WORD; $L <= min(MAX_WORD, $b); $L++) {
                if (!empty($slots[$i][$L])) $total += count($slots[$i][$L]) * $ways[$i + 1][$b - $L];
            }
            $ways[$i][$b] = $total;
        }
    }
    if ($budget < 0 || !$ways[0][$budget]) {
        $shortest = $fixed;
        foreach ($slots as $slot) for ($L = MIN_WORD; $L <= MAX_WORD; $L++) if (!empty($slot[$L])) { $shortest += $L; break; }
        too_short($format, $shortest);
    }

    $words = [];
    for ($attempt = 0; $attempt < 20; $attempt++) {
        $left = $budget;
        $words = [];
        $used = [];
        $dup = false;
        for ($i = 0; $i < $kk; $i++) {
            $r = random_int(0, $ways[$i][$left] - 1);
            $word = null;
            for ($L = MIN_WORD; $L <= min(MAX_WORD, $left); $L++) {
                if (empty($slots[$i][$L])) continue;
                $per = $ways[$i + 1][$left - $L];
                $w = count($slots[$i][$L]) * $per;
                if ($r < $w) { $word = $slots[$i][$L][intdiv($r, $per)]; break; }
                $r -= $w;
            }
            if ($word === null || isset($used[$word])) { $dup = true; break; }
            $used[$word] = true;
            $words[] = $word;
            $left -= $L;
        }
        if (!$dup) break;
    }
    if ($dup) fail($format, 'could not build a password, try again', 503);

    foreach ($words as $i => $w) if ($i % 2) $words[$i] = mb_strtoupper($w);
    $pw = implode($sep, $words);
    if ($n) $pw .= $sep . random_int(0, 9);
    return $pw;
}

$password = $memorable
    ? generate_memorable(load_memo($lang), $words, $sep, $number, $max, $format)
    : generate_plain(load_words($lang), $words, $sep, $number, $max, $format);

if ($format === 'json') {
    echo json_encode([
        'password' => $password,
        'length' => mb_strlen($password),
        'words' => $words,
        'separator' => $sep,
        'number' => $number,
        'memorable' => $memorable,
        'lang' => $lang,
        'docs' => 'https://asimplepassword.com/llms.txt',
    ], JSON_UNESCAPED_SLASHES) . "\n";
} else {
    echo $password . "\n";
}
