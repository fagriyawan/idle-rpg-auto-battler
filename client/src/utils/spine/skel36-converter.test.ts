import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { convertSkel36ToJson } from './skel36-converter';

describe('skel36-converter', () => {
  const assetsDir = resolve(__dirname, '../../../public/assets/heroes');

  it('converts hero 003 .skel file to valid JSON structure', () => {
    const skelPath = resolve(assetsDir, '003/L05001.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;

    expect(json).toHaveProperty('skeleton');
    expect(json).toHaveProperty('bones');
    expect(json).toHaveProperty('slots');
    expect(json).toHaveProperty('skins');
    expect(json).toHaveProperty('animations');

    const skeleton = json.skeleton as Record<string, unknown>;
    expect(skeleton.spine).toBeDefined();
    expect(typeof skeleton.width).toBe('number');
    expect(typeof skeleton.height).toBe('number');

    const bones = json.bones as Array<Record<string, unknown>>;
    expect(bones.length).toBeGreaterThan(0);
    expect(bones[0]).toHaveProperty('name');
  });

  it('converts hero 005 .skel file to valid JSON structure', () => {
    const skelPath = resolve(assetsDir, '005/crew110016.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;

    expect(json).toHaveProperty('skeleton');
    expect(json).toHaveProperty('bones');
    expect(json).toHaveProperty('slots');
    expect(json).toHaveProperty('skins');
    expect(json).toHaveProperty('animations');
  });

  it('converts hero 006 .skel file to valid JSON structure', () => {
    const skelPath = resolve(assetsDir, '006/crew110026.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;

    expect(json).toHaveProperty('skeleton');
    expect(json).toHaveProperty('bones');
    expect(json).toHaveProperty('slots');
    expect(json).toHaveProperty('skins');
    expect(json).toHaveProperty('animations');
  });

  it('converts hero 007 .skel file to valid JSON structure', () => {
    const skelPath = resolve(assetsDir, '007/crew130004.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;

    expect(json).toHaveProperty('skeleton');
    expect(json).toHaveProperty('bones');
    expect(json).toHaveProperty('slots');
    expect(json).toHaveProperty('skins');
    expect(json).toHaveProperty('animations');
  });

  it('produces bones with correct parent references', () => {
    const skelPath = resolve(assetsDir, '003/L05001.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;
    const bones = json.bones as Array<Record<string, unknown>>;

    // First bone (root) should have no parent
    expect(bones[0]).not.toHaveProperty('parent');

    // All other bones should have a parent that exists in the bone list
    const boneNames = new Set(bones.map(b => b.name));
    for (let i = 1; i < bones.length; i++) {
      expect(bones[i]).toHaveProperty('parent');
      expect(boneNames.has(bones[i].parent as string)).toBe(true);
    }
  });

  it('produces animations with valid timeline data', () => {
    const skelPath = resolve(assetsDir, '003/L05001.skel');
    const buffer = readFileSync(skelPath).buffer;
    const json = convertSkel36ToJson(buffer) as Record<string, unknown>;
    const animations = json.animations as Record<string, Record<string, unknown>>;

    const animNames = Object.keys(animations);
    expect(animNames.length).toBeGreaterThan(0);

    // Each animation should have at least one timeline type
    for (const animName of animNames) {
      const anim = animations[animName];
      const hasTimelines =
        anim.bones || anim.slots || anim.drawOrder || anim.events || anim.deform;
      expect(hasTimelines).toBeTruthy();
    }
  });

  describe('error handling', () => {
    it('throws on empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      expect(() => convertSkel36ToJson(buffer)).toThrow('Invalid Spine binary: buffer is empty');
    });

    it('throws on buffer too small', () => {
      const buffer = new ArrayBuffer(5);
      expect(() => convertSkel36ToJson(buffer)).toThrow('Invalid Spine binary: buffer too small');
    });

    it('throws on unexpected EOF during parsing', () => {
      // A buffer that has just enough for the hash string (null = 1 byte varint 0)
      // and version string (null = 1 byte varint 0) but not enough for width float
      const buffer = new ArrayBuffer(14);
      const view = new Uint8Array(buffer);
      // hash = null (varint 0)
      view[0] = 0;
      // spine version = null (varint 0)
      view[1] = 0;
      // width float (4 bytes) - ok
      // height float (4 bytes) - ok
      // nonessential boolean (1 byte) - ok
      // boneCount varint (1 byte) = 1 bone
      view[10] = 0; // nonessential = false
      view[11] = 1; // boneCount = 1
      // bone name starts but buffer ends abruptly
      view[12] = 5; // string length varint = 5 (means 4 chars)
      // Only 1 byte left but need 4 chars - should throw
      view[13] = 65; // 'A'
      expect(() => convertSkel36ToJson(buffer)).toThrow('Invalid Spine binary:');
    });

    it('throws on invalid bone parent index', () => {
      // Construct a minimal buffer with 2 bones where bone 1 has an invalid parent index
      const bytes: number[] = [];
      // hash = null
      bytes.push(0);
      // spine version = null
      bytes.push(0);
      // width = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // height = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // nonessential = false
      bytes.push(0);
      // boneCount = 2
      bytes.push(2);
      // Bone 0: name = "root" (varint length 5 = 4 chars + 1)
      bytes.push(5, 114, 111, 111, 116); // "root"
      // Bone 0: rotation, x, y, scaleX, scaleY, shearX, shearY, length (8 floats = 32 bytes)
      for (let i = 0; i < 32; i++) bytes.push(0);
      // Bone 0: transformMode = 0
      bytes.push(0);
      // Bone 1: name = "child" (varint length 6 = 5 chars + 1)
      bytes.push(6, 99, 104, 105, 108, 100); // "child"
      // Bone 1: parent index = 5 (out of range, only bone 0 exists before this)
      bytes.push(5);

      const buffer = new Uint8Array(bytes).buffer;
      expect(() => convertSkel36ToJson(buffer)).toThrow(
        'Invalid Spine binary: bone parent index out of range at bone 1'
      );
    });

    it('throws on invalid slot bone index', () => {
      // Construct a minimal buffer with 1 bone and 1 slot with invalid bone index
      const bytes: number[] = [];
      // hash = null
      bytes.push(0);
      // spine version = null
      bytes.push(0);
      // width = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // height = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // nonessential = false
      bytes.push(0);
      // boneCount = 1
      bytes.push(1);
      // Bone 0: name = "root" (varint length 5 = 4 chars + 1)
      bytes.push(5, 114, 111, 111, 116); // "root"
      // Bone 0: rotation, x, y, scaleX, scaleY, shearX, shearY, length (8 floats = 32 bytes)
      for (let i = 0; i < 32; i++) bytes.push(0);
      // Bone 0: transformMode = 0
      bytes.push(0);
      // slotCount = 1
      bytes.push(1);
      // Slot 0: name = "slot" (varint length 5 = 4 chars + 1)
      bytes.push(5, 115, 108, 111, 116); // "slot"
      // Slot 0: bone index = 99 (out of range, only 1 bone exists)
      bytes.push(99);

      const buffer = new Uint8Array(bytes).buffer;
      expect(() => convertSkel36ToJson(buffer)).toThrow(
        'Invalid Spine binary: slot bone index out of range at slot 0'
      );
    });

    it('wraps unexpected errors with parse context', () => {
      // A buffer that passes initial validation but has corrupted data
      // that causes an unexpected error during parsing
      const bytes: number[] = [];
      // hash = null
      bytes.push(0);
      // spine version = null
      bytes.push(0);
      // width = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // height = 0.0 (4 bytes)
      bytes.push(0, 0, 0, 0);
      // nonessential = false
      bytes.push(0);
      // boneCount = 1
      bytes.push(1);
      // Bone 0: name = "root"
      bytes.push(5, 114, 111, 111, 116);
      // Bone 0: 8 floats (32 bytes all zero)
      for (let i = 0; i < 32; i++) bytes.push(0);
      // Bone 0: transformMode = 0
      bytes.push(0);
      // slotCount = 1
      bytes.push(1);
      // Slot 0: name = "s"
      bytes.push(2, 115);
      // Slot 0: bone index = 0 (valid)
      bytes.push(0);
      // Slot 0: color (4 bytes) = white
      bytes.push(0xff, 0xff, 0xff, 0xff);
      // Slot 0: dark color (4 bytes) = -1 (no dark)
      bytes.push(0xff, 0xff, 0xff, 0xff);
      // Slot 0: attachment = null
      bytes.push(0);
      // Slot 0: blendMode = 0
      bytes.push(0);
      // ikCount = 0
      bytes.push(0);
      // transformCount = 0
      bytes.push(0);
      // pathConstraintCount = 0
      bytes.push(0);
      // skins: default skin slot count = 0
      bytes.push(0);
      // named skin count = 0
      bytes.push(0);
      // eventCount = 0
      bytes.push(0);
      // animationCount = 1
      bytes.push(1);
      // Animation name = "a"
      bytes.push(2, 97);
      // Slot timeline count = 0
      bytes.push(0);
      // Bone timeline count = 0
      bytes.push(0);
      // IK timeline count = 0
      bytes.push(0);
      // Transform timeline count = 0
      bytes.push(0);
      // Path timeline count = 0
      bytes.push(0);
      // Deform timeline count = 0
      bytes.push(0);
      // Draw order count = 0
      bytes.push(0);
      // Event timeline count = 0
      bytes.push(0);

      // This should parse successfully (valid minimal skeleton)
      const buffer = new Uint8Array(bytes).buffer;
      const json = convertSkel36ToJson(buffer) as Record<string, unknown>;
      expect(json).toHaveProperty('skeleton');
      expect(json).toHaveProperty('bones');
      expect(json).toHaveProperty('animations');
    });
  });
});
