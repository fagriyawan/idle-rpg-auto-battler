/**
 * Spine 3.6 Binary (.skel) to JSON Converter
 *
 * Converts Spine 3.6 binary skeleton data (ArrayBuffer) into a JSON object
 * compatible with pixi-spine's JSON parser.
 *
 * Ported from the official Spine 3.6 SkeletonBinary runtime (C#).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const BONE_ROTATE = 0;
const BONE_TRANSLATE = 1;
const BONE_SCALE = 2;
const BONE_SHEAR = 3;

const SLOT_ATTACHMENT = 0;
const SLOT_COLOR = 1;
const SLOT_TWO_COLOR = 2;

const PATH_POSITION = 0;
const PATH_SPACING = 1;
const PATH_MIX = 2;

const CURVE_LINEAR = 0;
const CURVE_STEPPED = 1;
const CURVE_BEZIER = 2;

const ATTACHMENT_REGION = 0;
const ATTACHMENT_BOUNDING_BOX = 1;
const ATTACHMENT_MESH = 2;
const ATTACHMENT_LINKED_MESH = 3;
const ATTACHMENT_PATH = 4;
const ATTACHMENT_POINT = 5;
const ATTACHMENT_CLIPPING = 6;

const BLEND_MODE_NAMES = ['normal', 'additive', 'multiply', 'screen'];
const TRANSFORM_MODE_NAMES = ['normal', 'onlyTranslation', 'noRotationOrReflection', 'noScale', 'noScaleOrReflection'];
const POSITION_MODE_NAMES = ['fixed', 'percent'];
const SPACING_MODE_NAMES = ['length', 'fixed', 'percent'];
const ROTATE_MODE_NAMES = ['tangent', 'chain', 'chainScale'];

// ─── Binary Reader ───────────────────────────────────────────────────────────

class BinaryReader {
  private data: DataView;
  private pos: number;
  private bytes: Uint8Array;

  constructor(buffer: ArrayBuffer) {
    this.data = new DataView(buffer);
    this.bytes = new Uint8Array(buffer);
    this.pos = 0;
  }

  getPosition(): number {
    return this.pos;
  }

  getLength(): number {
    return this.bytes.length;
  }

  private checkBounds(bytesNeeded: number): void {
    if (this.pos + bytesNeeded > this.bytes.length) {
      throw new Error(
        `Invalid Spine binary: unexpected end of data at position ${this.pos} (need ${bytesNeeded} bytes, ${this.bytes.length - this.pos} remaining)`
      );
    }
  }

  readByte(): number {
    this.checkBounds(1);
    return this.bytes[this.pos++];
  }

  readSignedByte(): number {
    this.checkBounds(1);
    const val = this.bytes[this.pos++];
    return val > 127 ? val - 256 : val;
  }

  readBoolean(): boolean {
    this.checkBounds(1);
    return this.bytes[this.pos++] !== 0;
  }

  readShort(): number {
    this.checkBounds(2);
    const val = (this.bytes[this.pos] << 8) | this.bytes[this.pos + 1];
    this.pos += 2;
    return val;
  }

  readInt(): number {
    this.checkBounds(4);
    const val =
      (this.bytes[this.pos] << 24) |
      (this.bytes[this.pos + 1] << 16) |
      (this.bytes[this.pos + 2] << 8) |
      this.bytes[this.pos + 3];
    this.pos += 4;
    return val;
  }

  readFloat(): number {
    this.checkBounds(4);
    // Spine binary uses big-endian floats
    const val = this.data.getFloat32(this.pos, false);
    this.pos += 4;
    return val;
  }

  readVarint(optimizePositive: boolean): number {
    this.checkBounds(1);
    let b = this.bytes[this.pos++];
    let result = b & 0x7f;
    if ((b & 0x80) !== 0) {
      this.checkBounds(1);
      b = this.bytes[this.pos++];
      result |= (b & 0x7f) << 7;
      if ((b & 0x80) !== 0) {
        this.checkBounds(1);
        b = this.bytes[this.pos++];
        result |= (b & 0x7f) << 14;
        if ((b & 0x80) !== 0) {
          this.checkBounds(1);
          b = this.bytes[this.pos++];
          result |= (b & 0x7f) << 21;
          if ((b & 0x80) !== 0) {
            this.checkBounds(1);
            b = this.bytes[this.pos++];
            result |= (b & 0x7f) << 28;
          }
        }
      }
    }
    if (optimizePositive) return result;
    return (result >>> 1) ^ -(result & 1);
  }

  readString(): string | null {
    let byteCount = this.readVarint(true);
    if (byteCount === 0) return null;
    if (byteCount === 1) return '';
    byteCount--;
    this.checkBounds(byteCount);
    const bytes = this.bytes.slice(this.pos, this.pos + byteCount);
    this.pos += byteCount;
    return new TextDecoder('utf-8').decode(bytes);
  }

  readColor(): string {
    this.checkBounds(4);
    const r = this.bytes[this.pos++];
    const g = this.bytes[this.pos++];
    const b = this.bytes[this.pos++];
    const a = this.bytes[this.pos++];
    return toHex8(r, g, b, a);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toHex8(r: number, g: number, b: number, a: number): string {
  return (
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0') +
    a.toString(16).padStart(2, '0')
  );
}

function toHex6(r: number, g: number, b: number): string {
  return (
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

function intToColor8(value: number): string {
  const r = (value >>> 24) & 0xff;
  const g = (value >>> 16) & 0xff;
  const b = (value >>> 8) & 0xff;
  const a = value & 0xff;
  return toHex8(r, g, b, a);
}

function intToColor6(value: number): string {
  const r = (value >>> 16) & 0xff;
  const g = (value >>> 8) & 0xff;
  const b = value & 0xff;
  return toHex6(r, g, b);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonObject = Record<string, any>;

interface LinkedMeshRef {
  mesh: JsonObject;
  skin: string | null;
  slotIndex: number;
  parent: string;
}

// ─── Main Converter ──────────────────────────────────────────────────────────

/**
 * Converts a Spine 3.6 binary .skel file (ArrayBuffer) to a JSON object
 * compatible with pixi-spine's JSON parser.
 */
export function convertSkel36ToJson(buffer: ArrayBuffer): object {
  // ─── Buffer validation ───
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Invalid Spine binary: buffer is empty');
  }
  // Minimum valid skel file needs at least a few bytes for header (hash string + version string + width/height/nonessential)
  if (buffer.byteLength < 13) {
    throw new Error('Invalid Spine binary: buffer too small');
  }

  const reader = new BinaryReader(buffer);
  const linkedMeshes: LinkedMeshRef[] = [];
  let parseSection = 'skeleton metadata';

  try {

  // ─── Skeleton metadata ───
  const skeleton: JsonObject = {};
  skeleton.hash = reader.readString() || undefined;
  skeleton.spine = reader.readString() || undefined;
  skeleton.width = reader.readFloat();
  skeleton.height = reader.readFloat();

  const nonessential = reader.readBoolean();
  if (nonessential) {
    skeleton.fps = reader.readFloat();
    skeleton.images = reader.readString() || undefined;
  }

  // ─── Bones ───
  parseSection = 'bones';
  const boneCount = reader.readVarint(true);
  const bones: JsonObject[] = [];
  const boneNames: string[] = [];

  for (let i = 0; i < boneCount; i++) {
    const bone: JsonObject = {};
    bone.name = reader.readString();
    boneNames.push(bone.name);

    if (i > 0) {
      const parentIndex = reader.readVarint(true);
      if (parentIndex < 0 || parentIndex >= i) {
        throw new Error(`Invalid Spine binary: bone parent index out of range at bone ${i}`);
      }
      bone.parent = boneNames[parentIndex];
    }

    bone.rotation = reader.readFloat();
    bone.x = reader.readFloat();
    bone.y = reader.readFloat();
    bone.scaleX = reader.readFloat();
    bone.scaleY = reader.readFloat();
    bone.shearX = reader.readFloat();
    bone.shearY = reader.readFloat();
    bone.length = reader.readFloat();
    const transformMode = reader.readVarint(true);
    if (transformMode !== 0) {
      bone.transform = TRANSFORM_MODE_NAMES[transformMode];
    }
    if (nonessential) {
      bone.color = reader.readColor();
    }
    bones.push(bone);
  }

  // ─── Slots ───
  parseSection = 'slots';
  const slotCount = reader.readVarint(true);
  const slots: JsonObject[] = [];
  const slotNames: string[] = [];

  for (let i = 0; i < slotCount; i++) {
    const slot: JsonObject = {};
    slot.name = reader.readString();
    slotNames.push(slot.name);

    const boneIndex = reader.readVarint(true);
    if (boneIndex < 0 || boneIndex >= boneNames.length) {
      throw new Error(`Invalid Spine binary: slot bone index out of range at slot ${i}`);
    }
    slot.bone = boneNames[boneIndex];

    const color = reader.readInt();
    const colorStr = intToColor8(color >>> 0);
    if (colorStr !== 'ffffffff') {
      slot.color = colorStr;
    }

    const darkColor = reader.readInt();
    if (darkColor !== -1) {
      slot.dark = intToColor6(darkColor >>> 0);
    }

    slot.attachment = reader.readString() || undefined;

    const blendMode = reader.readVarint(true);
    if (blendMode !== 0) {
      slot.blend = BLEND_MODE_NAMES[blendMode];
    }

    slots.push(slot);
  }

  // ─── IK Constraints ───
  parseSection = 'IK constraints';
  const ikCount = reader.readVarint(true);
  const ik: JsonObject[] = [];

  for (let i = 0; i < ikCount; i++) {
    const constraint: JsonObject = {};
    constraint.name = reader.readString();
    constraint.order = reader.readVarint(true);

    const ikBoneCount = reader.readVarint(true);
    const ikBones: string[] = [];
    for (let j = 0; j < ikBoneCount; j++) {
      ikBones.push(boneNames[reader.readVarint(true)]);
    }
    constraint.bones = ikBones;
    constraint.target = boneNames[reader.readVarint(true)];
    constraint.mix = reader.readFloat();
    const bendDirection = reader.readSignedByte();
    if (bendDirection === -1) {
      constraint.bendPositive = false;
    }
    ik.push(constraint);
  }

  // ─── Transform Constraints ───
  parseSection = 'transform constraints';
  const transformCount = reader.readVarint(true);
  const transform: JsonObject[] = [];

  for (let i = 0; i < transformCount; i++) {
    const constraint: JsonObject = {};
    constraint.name = reader.readString();
    constraint.order = reader.readVarint(true);

    const tcBoneCount = reader.readVarint(true);
    const tcBones: string[] = [];
    for (let j = 0; j < tcBoneCount; j++) {
      tcBones.push(boneNames[reader.readVarint(true)]);
    }
    constraint.bones = tcBones;
    constraint.target = boneNames[reader.readVarint(true)];

    constraint.local = reader.readBoolean();
    constraint.relative = reader.readBoolean();
    constraint.rotation = reader.readFloat();
    constraint.x = reader.readFloat();
    constraint.y = reader.readFloat();
    constraint.scaleX = reader.readFloat();
    constraint.scaleY = reader.readFloat();
    constraint.shearY = reader.readFloat();
    constraint.rotateMix = reader.readFloat();
    constraint.translateMix = reader.readFloat();
    constraint.scaleMix = reader.readFloat();
    constraint.shearMix = reader.readFloat();

    transform.push(constraint);
  }

  // ─── Path Constraints ───
  parseSection = 'path constraints';
  const pathConstraintCount = reader.readVarint(true);
  const path: JsonObject[] = [];

  for (let i = 0; i < pathConstraintCount; i++) {
    const constraint: JsonObject = {};
    constraint.name = reader.readString();
    constraint.order = reader.readVarint(true);

    const pcBoneCount = reader.readVarint(true);
    const pcBones: string[] = [];
    for (let j = 0; j < pcBoneCount; j++) {
      pcBones.push(boneNames[reader.readVarint(true)]);
    }
    constraint.bones = pcBones;
    constraint.target = slotNames[reader.readVarint(true)];
    constraint.positionMode = POSITION_MODE_NAMES[reader.readVarint(true)];
    constraint.spacingMode = SPACING_MODE_NAMES[reader.readVarint(true)];
    constraint.rotateMode = ROTATE_MODE_NAMES[reader.readVarint(true)];
    constraint.rotation = reader.readFloat();
    constraint.position = reader.readFloat();
    constraint.spacing = reader.readFloat();
    constraint.rotateMix = reader.readFloat();
    constraint.translateMix = reader.readFloat();

    path.push(constraint);
  }

  // ─── Skins ───
  parseSection = 'skins';
  const skins: JsonObject = {};

  // Helper: read vertices (weighted or unweighted)
  function readVertices(reader: BinaryReader, vertexCount: number): { vertices: number[]; bones?: number[] } {
    const isWeighted = reader.readBoolean();
    const verticesLength = vertexCount << 1;

    if (!isWeighted) {
      const vertices: number[] = [];
      for (let i = 0; i < verticesLength; i++) {
        vertices.push(reader.readFloat());
      }
      return { vertices };
    }

    // Weighted vertices
    const weights: number[] = [];
    const bonesArr: number[] = [];
    for (let i = 0; i < vertexCount; i++) {
      const boneCountForVertex = reader.readVarint(true);
      bonesArr.push(boneCountForVertex);
      for (let j = 0; j < boneCountForVertex; j++) {
        bonesArr.push(reader.readVarint(true));
        weights.push(reader.readFloat());
        weights.push(reader.readFloat());
        weights.push(reader.readFloat());
      }
    }
    return { vertices: weights, bones: bonesArr };
  }

  // Helper: read float array
  function readFloatArray(reader: BinaryReader, n: number): number[] {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      arr.push(reader.readFloat());
    }
    return arr;
  }

  // Helper: read short array (triangle indices)
  function readShortArray(reader: BinaryReader): number[] {
    const n = reader.readVarint(true);
    const arr: number[] = [];
    for (let i = 0; i < n; i++) {
      arr.push((reader.readByte() << 8) | reader.readByte());
    }
    return arr;
  }

  // Helper: read attachment
  function readAttachment(reader: BinaryReader, slotIndex: number, attachmentName: string): JsonObject | null {
    let name = reader.readString();
    if (name === null) name = attachmentName;

    const type = reader.readByte();

    switch (type) {
      case ATTACHMENT_REGION: {
        const attachment: JsonObject = {};
        const path = reader.readString();
        attachment.rotation = reader.readFloat();
        attachment.x = reader.readFloat();
        attachment.y = reader.readFloat();
        attachment.scaleX = reader.readFloat();
        attachment.scaleY = reader.readFloat();
        attachment.width = reader.readFloat();
        attachment.height = reader.readFloat();
        const color = reader.readInt() >>> 0;
        const colorStr = intToColor8(color);
        if (colorStr !== 'ffffffff') {
          attachment.color = colorStr;
        }
        if (path && path !== name) {
          attachment.path = path;
        }
        // Remove defaults
        if (attachment.rotation === 0) delete attachment.rotation;
        if (attachment.x === 0) delete attachment.x;
        if (attachment.y === 0) delete attachment.y;
        if (attachment.scaleX === 1) delete attachment.scaleX;
        if (attachment.scaleY === 1) delete attachment.scaleY;
        return { name, attachment };
      }

      case ATTACHMENT_BOUNDING_BOX: {
        const attachment: JsonObject = { type: 'boundingbox' };
        const vertexCount = reader.readVarint(true);
        const vertData = readVertices(reader, vertexCount);
        attachment.vertexCount = vertexCount;
        attachment.vertices = vertData.vertices;
        if (vertData.bones) {
          attachment.bones = vertData.bones;
          // For weighted, vertices contains interleaved bone data
        }
        if (nonessential) {
          const color = reader.readInt() >>> 0;
          attachment.color = intToColor8(color);
        }
        return { name, attachment };
      }

      case ATTACHMENT_MESH: {
        const attachment: JsonObject = { type: 'mesh' };
        const meshPath = reader.readString();
        const color = reader.readInt() >>> 0;
        const colorStr = intToColor8(color);
        if (colorStr !== 'ffffffff') {
          attachment.color = colorStr;
        }
        const vertexCount = reader.readVarint(true);
        const uvs = readFloatArray(reader, vertexCount << 1);
        const triangles = readShortArray(reader);
        const vertData = readVertices(reader, vertexCount);
        const hullLength = reader.readVarint(true);

        attachment.uvs = uvs;
        attachment.triangles = triangles;
        attachment.vertices = vertData.vertices;
        if (vertData.bones) {
          attachment.bones = vertData.bones;
        }
        attachment.hull = hullLength;

        if (nonessential) {
          attachment.edges = readShortArray(reader);
          attachment.width = reader.readFloat();
          attachment.height = reader.readFloat();
        }
        if (meshPath && meshPath !== name) {
          attachment.path = meshPath;
        }
        return { name, attachment };
      }

      case ATTACHMENT_LINKED_MESH: {
        const attachment: JsonObject = { type: 'linkedmesh' };
        const linkedPath = reader.readString();
        const color = reader.readInt() >>> 0;
        const colorStr = intToColor8(color);
        if (colorStr !== 'ffffffff') {
          attachment.color = colorStr;
        }
        const skinName = reader.readString();
        const parentName = reader.readString()!;
        attachment.deform = reader.readBoolean();
        if (nonessential) {
          attachment.width = reader.readFloat();
          attachment.height = reader.readFloat();
        }
        if (linkedPath && linkedPath !== name) {
          attachment.path = linkedPath;
        }
        if (skinName) {
          attachment.skin = skinName;
        }
        attachment.parent = parentName;

        linkedMeshes.push({
          mesh: attachment,
          skin: skinName,
          slotIndex,
          parent: parentName,
        });
        return { name, attachment };
      }

      case ATTACHMENT_PATH: {
        const attachment: JsonObject = { type: 'path' };
        attachment.closed = reader.readBoolean();
        attachment.constantSpeed = reader.readBoolean();
        const vertexCount = reader.readVarint(true);
        const vertData = readVertices(reader, vertexCount);
        attachment.vertexCount = vertexCount;
        attachment.vertices = vertData.vertices;
        if (vertData.bones) {
          attachment.bones = vertData.bones;
        }
        const lengthCount = vertexCount / 3;
        const lengths: number[] = [];
        for (let l = 0; l < lengthCount; l++) {
          lengths.push(reader.readFloat());
        }
        attachment.lengths = lengths;
        if (nonessential) {
          const color = reader.readInt() >>> 0;
          attachment.color = intToColor8(color);
        }
        return { name, attachment };
      }

      case ATTACHMENT_POINT: {
        const attachment: JsonObject = { type: 'point' };
        attachment.rotation = reader.readFloat();
        attachment.x = reader.readFloat();
        attachment.y = reader.readFloat();
        if (nonessential) {
          const color = reader.readInt() >>> 0;
          attachment.color = intToColor8(color);
        }
        return { name, attachment };
      }

      case ATTACHMENT_CLIPPING: {
        const attachment: JsonObject = { type: 'clipping' };
        const endSlotIndex = reader.readVarint(true);
        attachment.end = slotNames[endSlotIndex];
        const vertexCount = reader.readVarint(true);
        const vertData = readVertices(reader, vertexCount);
        attachment.vertexCount = vertexCount;
        attachment.vertices = vertData.vertices;
        if (vertData.bones) {
          attachment.bones = vertData.bones;
        }
        if (nonessential) {
          const color = reader.readInt() >>> 0;
          attachment.color = intToColor8(color);
        }
        return { name, attachment };
      }

      default:
        return null;
    }
  }

  // Helper: read skin
  function readSkin(reader: BinaryReader): JsonObject | null {
    const skinSlotCount = reader.readVarint(true);
    if (skinSlotCount === 0) return null;

    const skin: JsonObject = {};
    for (let i = 0; i < skinSlotCount; i++) {
      const slotIndex = reader.readVarint(true);
      const slotName = slotNames[slotIndex];
      const attachmentCount = reader.readVarint(true);
      const slotAttachments: JsonObject = {};

      for (let j = 0; j < attachmentCount; j++) {
        const attachmentName = reader.readString()!;
        const result = readAttachment(reader, slotIndex, attachmentName);
        if (result) {
          slotAttachments[result.name as string] = result.attachment;
        }
      }
      skin[slotName] = slotAttachments;
    }
    return skin;
  }

  // Read default skin
  const defaultSkin = readSkin(reader);
  if (defaultSkin) {
    skins['default'] = defaultSkin;
  }

  // Read named skins
  const namedSkinCount = reader.readVarint(true);
  for (let i = 0; i < namedSkinCount; i++) {
    const skinName = reader.readString()!;
    const skin = readSkin(reader);
    if (skin) {
      skins[skinName] = skin;
    }
  }

  // ─── Events ───
  parseSection = 'events';
  const eventCount = reader.readVarint(true);
  const events: JsonObject = {};

  for (let i = 0; i < eventCount; i++) {
    const eventName = reader.readString()!;
    const event: JsonObject = {};
    const intVal = reader.readVarint(false);
    if (intVal !== 0) event.int = intVal;
    const floatVal = reader.readFloat();
    if (floatVal !== 0) event.float = floatVal;
    const stringVal = reader.readString();
    if (stringVal) event.string = stringVal;
    events[eventName] = event;
  }

  // Store event names for animation event timeline
  const eventNames = Object.keys(events);

  // ─── Animations ───
  parseSection = 'animations';
  const animations: JsonObject = {};

  // Helper: read curve data
  function readCurve(reader: BinaryReader): JsonObject | undefined {
    const curveType = reader.readByte();
    switch (curveType) {
      case CURVE_STEPPED:
        return { curve: 'stepped' };
      case CURVE_BEZIER:
        return {
          curve: [
            reader.readFloat(),
            reader.readFloat(),
            reader.readFloat(),
            reader.readFloat(),
          ],
        };
      case CURVE_LINEAR:
      default:
        return undefined;
    }
  }

  const animationCount = reader.readVarint(true);

  for (let animIdx = 0; animIdx < animationCount; animIdx++) {
    const animName = reader.readString()!;
    const animation: JsonObject = {};

    // Slot timelines
    const slotTimelineCount = reader.readVarint(true);
    if (slotTimelineCount > 0) {
      const slotsAnim: JsonObject = {};
      for (let i = 0; i < slotTimelineCount; i++) {
        const slotIndex = reader.readVarint(true);
        const slotName = slotNames[slotIndex];
        const slotTimeline: JsonObject = {};
        const timelineTypeCount = reader.readVarint(true);

        for (let j = 0; j < timelineTypeCount; j++) {
          const timelineType = reader.readByte();
          const frameCount = reader.readVarint(true);

          switch (timelineType) {
            case SLOT_ATTACHMENT: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                frame.name = reader.readString();
                frames.push(frame);
              }
              slotTimeline.attachment = frames;
              break;
            }
            case SLOT_COLOR: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                const color = reader.readInt() >>> 0;
                frame.color = intToColor8(color);
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              slotTimeline.color = frames;
              break;
            }
            case SLOT_TWO_COLOR: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                const color = reader.readInt() >>> 0;
                frame.light = intToColor8(color);
                const dark = reader.readInt() >>> 0;
                frame.dark = intToColor6(dark & 0x00ffffff);
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              slotTimeline.twoColor = frames;
              break;
            }
          }
        }
        slotsAnim[slotName] = slotTimeline;
      }
      animation.slots = slotsAnim;
    }

    // Bone timelines
    const boneTimelineCount = reader.readVarint(true);
    if (boneTimelineCount > 0) {
      const bonesAnim: JsonObject = {};
      for (let i = 0; i < boneTimelineCount; i++) {
        const boneIndex = reader.readVarint(true);
        const boneName = boneNames[boneIndex];
        const boneTimeline: JsonObject = {};
        const timelineTypeCount = reader.readVarint(true);

        for (let j = 0; j < timelineTypeCount; j++) {
          const timelineType = reader.readByte();
          const frameCount = reader.readVarint(true);

          switch (timelineType) {
            case BONE_ROTATE: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                frame.angle = reader.readFloat();
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              boneTimeline.rotate = frames;
              break;
            }
            case BONE_TRANSLATE:
            case BONE_SCALE:
            case BONE_SHEAR: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                frame.x = reader.readFloat();
                frame.y = reader.readFloat();
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              const key =
                timelineType === BONE_TRANSLATE ? 'translate' :
                timelineType === BONE_SCALE ? 'scale' : 'shear';
              boneTimeline[key] = frames;
              break;
            }
          }
        }
        bonesAnim[boneName] = boneTimeline;
      }
      animation.bones = bonesAnim;
    }

    // IK constraint timelines
    const ikTimelineCount = reader.readVarint(true);
    if (ikTimelineCount > 0) {
      const ikAnim: JsonObject = {};
      for (let i = 0; i < ikTimelineCount; i++) {
        const constraintIndex = reader.readVarint(true);
        const frameCount = reader.readVarint(true);
        const frames: JsonObject[] = [];
        for (let f = 0; f < frameCount; f++) {
          const frame: JsonObject = {};
          frame.time = reader.readFloat();
          frame.mix = reader.readFloat();
          const bendDir = reader.readSignedByte();
          if (bendDir === -1) {
            frame.bendPositive = false;
          }
          if (f < frameCount - 1) {
            const curve = readCurve(reader);
            if (curve) Object.assign(frame, curve);
          }
          frames.push(frame);
        }
        ikAnim[ik[constraintIndex].name as string] = frames;
      }
      animation.ik = ikAnim;
    }

    // Transform constraint timelines
    const transformTimelineCount = reader.readVarint(true);
    if (transformTimelineCount > 0) {
      const transformAnim: JsonObject = {};
      for (let i = 0; i < transformTimelineCount; i++) {
        const constraintIndex = reader.readVarint(true);
        const frameCount = reader.readVarint(true);
        const frames: JsonObject[] = [];
        for (let f = 0; f < frameCount; f++) {
          const frame: JsonObject = {};
          frame.time = reader.readFloat();
          frame.rotateMix = reader.readFloat();
          frame.translateMix = reader.readFloat();
          frame.scaleMix = reader.readFloat();
          frame.shearMix = reader.readFloat();
          if (f < frameCount - 1) {
            const curve = readCurve(reader);
            if (curve) Object.assign(frame, curve);
          }
          frames.push(frame);
        }
        transformAnim[transform[constraintIndex].name as string] = frames;
      }
      animation.transform = transformAnim;
    }

    // Path constraint timelines
    const pathTimelineCount = reader.readVarint(true);
    if (pathTimelineCount > 0) {
      const pathAnim: JsonObject = {};
      for (let i = 0; i < pathTimelineCount; i++) {
        const constraintIndex = reader.readVarint(true);
        const pathTimelineTypeCount = reader.readVarint(true);
        const constraintTimelines: JsonObject = {};

        for (let j = 0; j < pathTimelineTypeCount; j++) {
          const timelineType = reader.readSignedByte();
          const frameCount = reader.readVarint(true);

          switch (timelineType) {
            case PATH_POSITION:
            case PATH_SPACING: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                frame[timelineType === PATH_POSITION ? 'position' : 'spacing'] = reader.readFloat();
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              constraintTimelines[timelineType === PATH_POSITION ? 'position' : 'spacing'] = frames;
              break;
            }
            case PATH_MIX: {
              const frames: JsonObject[] = [];
              for (let f = 0; f < frameCount; f++) {
                const frame: JsonObject = {};
                frame.time = reader.readFloat();
                frame.rotateMix = reader.readFloat();
                frame.translateMix = reader.readFloat();
                if (f < frameCount - 1) {
                  const curve = readCurve(reader);
                  if (curve) Object.assign(frame, curve);
                }
                frames.push(frame);
              }
              constraintTimelines.mix = frames;
              break;
            }
          }
        }
        pathAnim[path[constraintIndex].name as string] = constraintTimelines;
      }
      animation.path = pathAnim;
    }

    // Deform (FFD) timelines
    const deformTimelineCount = reader.readVarint(true);
    if (deformTimelineCount > 0) {
      const deformAnim: JsonObject = {};
      for (let i = 0; i < deformTimelineCount; i++) {
        const skinIndex = reader.readVarint(true);
        const skinName = skinIndex === 0 ? 'default' : Object.keys(skins)[skinIndex];
        if (!deformAnim[skinName]) deformAnim[skinName] = {};

        const deformSlotCount = reader.readVarint(true);
        for (let j = 0; j < deformSlotCount; j++) {
          const slotIndex = reader.readVarint(true);
          const slotName = slotNames[slotIndex];
          if (!deformAnim[skinName][slotName]) deformAnim[skinName][slotName] = {};

          const deformAttachmentCount = reader.readVarint(true);
          for (let k = 0; k < deformAttachmentCount; k++) {
            const attachmentName = reader.readString()!;
            const frameCount = reader.readVarint(true);
            const frames: JsonObject[] = [];

            for (let f = 0; f < frameCount; f++) {
              const frame: JsonObject = {};
              frame.time = reader.readFloat();

              const end = reader.readVarint(true);
              if (end === 0) {
                // No deform data for this frame (identity)
                frame.vertices = [];
              } else {
                const start = reader.readVarint(true);
                const deformVertices: number[] = [];
                // Fill leading zeros
                for (let v = 0; v < start; v++) {
                  deformVertices.push(0);
                }
                // Read deform values
                for (let v = 0; v < end; v++) {
                  deformVertices.push(reader.readFloat());
                }
                frame.offset = start;
                frame.vertices = deformVertices.slice(start);
              }

              if (f < frameCount - 1) {
                const curve = readCurve(reader);
                if (curve) Object.assign(frame, curve);
              }
              frames.push(frame);
            }
            deformAnim[skinName][slotName][attachmentName] = frames;
          }
        }
      }
      animation.deform = deformAnim;
    }

    // Draw order timeline
    const drawOrderCount = reader.readVarint(true);
    if (drawOrderCount > 0) {
      const drawOrderFrames: JsonObject[] = [];
      for (let i = 0; i < drawOrderCount; i++) {
        const frame: JsonObject = {};
        frame.time = reader.readFloat();
        const offsetCount = reader.readVarint(true);
        if (offsetCount > 0) {
          const offsets: JsonObject[] = [];
          for (let j = 0; j < offsetCount; j++) {
            const offset: JsonObject = {};
            offset.slot = slotNames[reader.readVarint(true)];
            offset.offset = reader.readVarint(true);
            offsets.push(offset);
          }
          frame.offsets = offsets;
        }
        drawOrderFrames.push(frame);
      }
      animation.drawOrder = drawOrderFrames;
    }

    // Event timeline
    const eventTimelineCount = reader.readVarint(true);
    if (eventTimelineCount > 0) {
      const eventFrames: JsonObject[] = [];
      for (let i = 0; i < eventTimelineCount; i++) {
        const frame: JsonObject = {};
        frame.time = reader.readFloat();
        const eventIndex = reader.readVarint(true);
        frame.name = eventNames[eventIndex];
        const intVal = reader.readVarint(false);
        const floatVal = reader.readFloat();
        const hasString = reader.readBoolean();
        const stringVal = hasString ? reader.readString() : null;
        if (intVal !== 0) frame.int = intVal;
        if (floatVal !== 0) frame.float = floatVal;
        if (stringVal) frame.string = stringVal;
        eventFrames.push(frame);
      }
      animation.events = eventFrames;
    }

    animations[animName] = animation;
  }

  // ─── Build final JSON ───
  const result: JsonObject = {};
  result.skeleton = skeleton;
  result.bones = bones;
  if (slots.length > 0) result.slots = slots;
  if (ik.length > 0) result.ik = ik;
  if (transform.length > 0) result.transform = transform;
  if (path.length > 0) result.path = path;
  if (Object.keys(skins).length > 0) result.skins = skins;
  if (Object.keys(events).length > 0) result.events = events;
  if (Object.keys(animations).length > 0) result.animations = animations;

  return result;

  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid Spine binary:')) {
      throw error;
    }
    const position = reader.getPosition();
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid Spine binary: failed to parse ${parseSection} at position ${position} (${message})`
    );
  }
}
