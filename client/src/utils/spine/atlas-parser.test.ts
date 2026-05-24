import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseAtlasPages } from './atlas-parser';

describe('Atlas Parser - parseAtlasPages', () => {
  const assetsDir = resolve(__dirname, '../../../public/assets/heroes');

  it('extracts one .png filename from a single-page atlas (hero 001 format)', () => {
    const atlasText = `
cream_arcade_000.png
pma:true
size: 512,384
format: RGBA8888
filter: Linear,Linear
repeat: none
Arm_Left_Down_01
  rotate: false
  xy: 239, 20
  size: 39, 49
`.trim();

    const pages = parseAtlasPages(atlasText);
    expect(pages).toEqual(['cream_arcade_000.png']);
  });

  it('extracts both .png filenames from a multi-page atlas (hero 004 format)', () => {
    const atlasText = `H30103.png
size: 2048,2048
format: RGBA8888
filter: Linear,Linear
repeat: none
0hit_06
  rotate: false
  xy: 741, 20
  size: 95, 72
  orig: 175, 175
  offset: 31, 60
  index: -1

H301032.png
size: 2048,1024
format: RGBA8888
filter: Linear,Linear
repeat: none
0hit_01
  rotate: false
  xy: 450, 79
  size: 129, 122`;

    const pages = parseAtlasPages(atlasText);
    expect(pages).toEqual(['H30103.png', 'H301032.png']);
  });

  it('returns empty array for empty atlas text', () => {
    expect(parseAtlasPages('')).toEqual([]);
  });

  it('returns empty array for atlas with no .png lines', () => {
    const atlasText = `size: 512,384
format: RGBA8888
filter: Linear,Linear
repeat: none
Arm_Left_Down_01
  rotate: false
  xy: 239, 20`;

    expect(parseAtlasPages(atlasText)).toEqual([]);
  });

  it('does NOT extract lines with colons (like "size: 512,384")', () => {
    const atlasText = `texture.png
size: 512,384
some_file_with_colon:.png
filter: Linear,Linear`;

    const pages = parseAtlasPages(atlasText);
    expect(pages).toEqual(['texture.png']);
    expect(pages).not.toContain('some_file_with_colon:.png');
  });

  it('does NOT extract lines with leading whitespace', () => {
    const atlasText = `texture.png
size: 512,384
  indented.png
\ttabbed.png
another_texture.png`;

    const pages = parseAtlasPages(atlasText);
    expect(pages).toEqual(['texture.png', 'another_texture.png']);
  });

  it('correctly parses real atlas content from hero 001', () => {
    const atlasPath = resolve(assetsDir, '001/cream_arcade_000.atlas');
    const atlasText = readFileSync(atlasPath, 'utf-8');

    const pages = parseAtlasPages(atlasText);
    expect(pages).toEqual(['cream_arcade_000.png']);
  });

  it('correctly parses real atlas content from hero 004 (multi-page)', () => {
    const atlasPath = resolve(assetsDir, '004/H30103.atlas');
    const atlasText = readFileSync(atlasPath, 'utf-8');

    const pages = parseAtlasPages(atlasText);
    expect(pages).toContain('H30103.png');
    expect(pages).toContain('H301032.png');
    expect(pages).toHaveLength(2);
  });
});
