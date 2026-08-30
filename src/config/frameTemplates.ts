export interface FrameSlot {
  id: 'slot_1' | 'slot_2' | 'slot_3';
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface FrameTemplate {
  id: string;
  name: string;
  fileName: string;
  assetPath: string;
  width: number;
  height: number;
  slots: [FrameSlot, FrameSlot, FrameSlot];
}

export const FRAME_TEMPLATES: Record<string, FrameTemplate> = {
  'mood-booster': {
    id: 'mood-booster',
    name: 'Mood Booster',
    fileName: '01 - Mood Booster.png',
    assetPath: '/assets/frames/01 - Mood Booster.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 103, y: 175, width: 736, height: 419 },
      { id: 'slot_2', x: 106, y: 627, width: 732, height: 416 },
      { id: 'slot_3', x: 104, y: 1077, width: 735, height: 422 },
    ],
  },
  'cloudy-day': {
    id: 'cloudy-day',
    name: 'Cloudy Day',
    fileName: '02 - cloudy day.png',
    assetPath: '/assets/frames/02 - cloudy day.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 108, y: 150, width: 726, height: 457 },
      { id: 'slot_2', x: 108, y: 644, width: 726, height: 397 },
      { id: 'slot_3', x: 108, y: 1077, width: 726, height: 379 },
    ],
  },
  'star-glow': {
    id: 'star-glow',
    name: 'Star Glow',
    fileName: '03 - star glow.png',
    assetPath: '/assets/frames/03 - star glow.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 108, y: 150, width: 726, height: 430 },
      { id: 'slot_2', x: 108, y: 613, width: 726, height: 418 },
      { id: 'slot_3', x: 108, y: 1059, width: 726, height: 382 },
    ],
  },
  'cat-mood': {
    id: 'cat-mood',
    name: 'Cat Mood',
    fileName: '04-cat mood.png',
    assetPath: '/assets/frames/04-cat mood.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 110, y: 150, width: 723, height: 426 },
      { id: 'slot_2', x: 110, y: 603, width: 723, height: 428 },
      { id: 'slot_3', x: 110, y: 1060, width: 723, height: 396 },
    ],
  },
  'campus-vibe': {
    id: 'campus-vibe',
    name: 'Campus Vibe',
    fileName: '05-campus vibe.png',
    assetPath: '/assets/frames/05-campus vibe.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 108, y: 150, width: 726, height: 409 },
      { id: 'slot_2', x: 108, y: 578, width: 726, height: 403 },
      { id: 'slot_3', x: 108, y: 1004, width: 726, height: 387 },
    ],
  },
  'minimal-ptik': {
    id: 'minimal-ptik',
    name: 'Minimal PTIK',
    fileName: 'Frame 06 - Minimal PTIK.png',
    assetPath: '/assets/frames/Frame 06 - Minimal PTIK.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 104, y: 183, width: 733, height: 409 },
      { id: 'slot_2', x: 104, y: 654, width: 733, height: 391 },
      { id: 'slot_3', x: 104, y: 1100, width: 733, height: 363 },
    ],
  },
  'flower-bloom': {
    id: 'flower-bloom',
    name: 'Flower Bloom',
    fileName: 'Frame 07 - Flower Bloom.png',
    assetPath: '/assets/frames/Frame 07 - Flower Bloom.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 107, y: 175, width: 730, height: 390 },
      { id: 'slot_2', x: 107, y: 616, width: 729, height: 389 },
      { id: 'slot_3', x: 107, y: 1057, width: 729, height: 343 },
    ],
  },
  'retro-film': {
    id: 'retro-film',
    name: 'Retro Film',
    fileName: 'Frame 08 - Retro Film.png',
    assetPath: '/assets/frames/Frame 08 - Retro Film.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 90, y: 186, width: 761, height: 382 },
      { id: 'slot_2', x: 90, y: 622, width: 761, height: 379 },
      { id: 'slot_3', x: 90, y: 1054, width: 761, height: 375 },
    ],
  },
  'rainbow-fun': {
    id: 'rainbow-fun',
    name: 'Rainbow Fun',
    fileName: 'Frame 09 - Rainbow Fun.png',
    assetPath: '/assets/frames/Frame 09 - Rainbow Fun.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 80, y: 94, width: 779, height: 459 },
      { id: 'slot_2', x: 81, y: 584, width: 780, height: 423 },
      { id: 'slot_3', x: 97, y: 1037, width: 753, height: 277 },
    ],
  },
  'doodle-style': {
    id: 'doodle-style',
    name: 'Doodle Style',
    fileName: 'Frame 10 - Doodle Style.png',
    assetPath: '/assets/frames/Frame 10 - Doodle Style.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 106, y: 208, width: 731, height: 388 },
      { id: 'slot_2', x: 106, y: 656, width: 730, height: 378 },
      { id: 'slot_3', x: 106, y: 1094, width: 730, height: 373 },
    ],
  },
  'blue-sky': {
    id: 'blue-sky',
    name: 'Blue Sky',
    fileName: 'Frame 11 - Blue Sky.png',
    assetPath: '/assets/frames/Frame 11 - Blue Sky.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 101, y: 253, width: 736, height: 339 },
      { id: 'slot_2', x: 102, y: 662, width: 737, height: 337 },
      { id: 'slot_3', x: 100, y: 1074, width: 738, height: 337 },
    ],
  },
  'pastel-check': {
    id: 'pastel-check',
    name: 'Pastel Check',
    fileName: 'Frame 12 - Pastel Check.png',
    assetPath: '/assets/frames/Frame 12 - Pastel Check.png',
    width: 941,
    height: 1672,
    slots: [
      { id: 'slot_1', x: 120, y: 227, width: 700, height: 376 },
      { id: 'slot_2', x: 121, y: 666, width: 700, height: 371 },
      { id: 'slot_3', x: 120, y: 1100, width: 700, height: 313 },
    ],
  },
};

export const DEFAULT_FRAME_TEMPLATE = FRAME_TEMPLATES['mood-booster'];

export function getAllFrameTemplates(): FrameTemplate[] {
  return Object.values(FRAME_TEMPLATES);
}

export function getFrameTemplate(id: string): FrameTemplate {
  return FRAME_TEMPLATES[id] || DEFAULT_FRAME_TEMPLATE;
}
