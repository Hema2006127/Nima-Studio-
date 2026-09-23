import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYouTubeId, youTubeEmbedUrl } from '../src/lib/youtube.ts';

const ID = 'dQw4w9WgXcQ';

test('accepts supported YouTube URL formats', () => {
  const urls = [
    ID,
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s&list=PL123`,
    `http://m.youtube.com/watch?feature=share&v=${ID}`,
    `youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc123`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/embed/${ID}?start=10`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
    `https://music.youtube.com/watch?v=${ID}`,
    `  https://youtu.be/${ID}  `,
  ];
  for (const url of urls) assert.equal(parseYouTubeId(url), ID, url);
});

test('rejects invalid or non-YouTube input', () => {
  const bad = [
    '',
    'hello',
    'dQw4w9WgXc', // 10 chars
    'dQw4w9WgXcQQ', // 12 chars
    `https://vimeo.com/${ID}`,
    `https://evil.com/watch?v=${ID}`,
    `https://youtube.com.evil.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?v=<script>`,
    `javascript:alert(1)//youtube.com/watch?v=${ID}`,
    `<iframe src="https://www.youtube.com/embed/${ID}"></iframe>`,
    'https://www.youtube.com/watch',
    'https://www.youtube.com/channel/UCabcdefghijk',
  ];
  for (const input of bad) assert.equal(parseYouTubeId(input), null, input);
});

test('embed URL uses youtube-nocookie and refuses invalid IDs', () => {
  assert.match(youTubeEmbedUrl(ID), /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.throws(() => youTubeEmbedUrl('"><script>'));
});
