import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDriveId, parseVideoUrl, videoEmbedUrl, videoThumbnailUrl } from '../src/lib/video.ts';

const DRIVE = '1rt8cwM9GuXrO1kujviEaT-AYhyOCWXbt';

test('parses Google Drive links', () => {
  const links = [
    `https://drive.google.com/file/d/${DRIVE}/view?usp=drive_link`,
    `https://drive.google.com/file/d/${DRIVE}/view?usp=sharing`,
    `https://drive.google.com/file/d/${DRIVE}/preview`,
    `https://drive.google.com/file/d/${DRIVE}`,
    `https://drive.google.com/open?id=${DRIVE}`,
    `https://drive.google.com/uc?id=${DRIVE}&export=download`,
    `https://docs.google.com/file/d/${DRIVE}/edit`,
    `drive.google.com/file/d/${DRIVE}/view`,
  ];
  for (const link of links) assert.equal(parseDriveId(link), DRIVE, link);
});

test('rejects non-Drive or malformed links', () => {
  const bad = [
    `https://evil.com/file/d/${DRIVE}/view`,
    `https://drive.google.com.evil.com/file/d/${DRIVE}/view`,
    'https://drive.google.com/drive/folders/',
    'https://drive.google.com/file/d/short/view',
    `https://drive.google.com/file/d/${DRIVE}"><script>/view`,
  ];
  for (const link of bad) assert.equal(parseDriveId(link), null, link);
});

test('parseVideoUrl picks the right provider', () => {
  assert.deepEqual(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ'), { provider: 'youtube', id: 'dQw4w9WgXcQ' });
  assert.deepEqual(parseVideoUrl(`https://drive.google.com/file/d/${DRIVE}/view`), { provider: 'drive', id: DRIVE });
  assert.equal(parseVideoUrl('https://vimeo.com/123'), null);
});

test('builds safe embed and thumbnail URLs', () => {
  assert.equal(videoEmbedUrl({ provider: 'drive', id: DRIVE }), `https://drive.google.com/file/d/${DRIVE}/preview`);
  assert.match(videoEmbedUrl({ provider: 'youtube', id: 'dQw4w9WgXcQ' }), /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  assert.match(videoThumbnailUrl({ provider: 'drive', id: DRIVE }), /^https:\/\/drive\.google\.com\/thumbnail\?id=/);
  assert.throws(() => videoEmbedUrl({ provider: 'drive', id: 'x"><script>' }));
});
