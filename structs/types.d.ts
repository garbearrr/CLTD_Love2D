type XCommaY = `${number},${number}`;

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Occupant {
    update(dt: number): void;
    draw(): void;
}

type Point = { x: number, y: number };

interface MazeResult {
  // the carved solution path from entrance to exit
  solution: Point[];
  // a 2D array marking whether a cell is open (true) or still walled off (false)
  grid: boolean[][];
}

interface IPriorityQueue<T> {
  enqueue(item: T): void;
  dequeue(): T | undefined;
  peek(): T | undefined;
  isEmpty(): boolean;
  size(): number;
  clear(): void;
  setComparator(cmp: (a: T, b: T) => boolean): void;
}

interface ICell {
  readonly i: number;
  readonly j: number;
  readonly key: XCommaY;

  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;

  immutable: boolean;

  setColor(r: number, g: number, b: number, a: number): this;
  pushChar(c: string, priority?: number, id?: number): this;
  pushCharSC(c: IStringColor, priority?: number, id?: number): this;
  clearChars(): this;
  removeAllCharWithPriority(priority: number): void;
  setCharSizeOffset(offset: number): this;
  setLast(c: ICell | null): this;
  setNext(c: ICell | null): this;
  setWalls(opts: { hcenter?: boolean; vcenter?: boolean; top?: boolean; bottom?: boolean; left?: boolean; right?: boolean }): this;
  clearNext(): this;
  clearLast(): this;
  clearWalls(): this;
  draw(): void;
  markBorder(): this;
  markCursor(): this;
  addEnemy(enemy: IBaseEnemy): this;
  removeEnemy(enemy: IBaseEnemy): this;
  getNext(): ICell | null;
  getChar(): IStringColor;
  setCharColor(r: number, g: number, b: number, a: number): this;
}

interface IBaseEnemy {
  name: string;
  icon: IStringColor;
  health: number;
  attack: number;
  defense: number;
  parent: ICell; // the cell that contains this enemy
  speed: number;

  readonly id: number; // unique ID for this enemy

  destroy(): void;
}

interface IStringColor {
  colorData: { from: number; to: number; color: Color }[];
  valueOf(): string;
  concat(...args: (string | IStringColor)[]): this;
  color(c: Color): this;
  colorRange(start: number, end: number, c: Color, elseColor?: Color): this;
  colorize(...ranges: { start: number; end: number; color: Color }[]): this;
  charAtIsColor(index: number): Color | undefined;
  reset(): this;
  utf8Length(): number;
  toUTF8Array(): string[];
}

// Color.ts ---------------------------------------------------
interface Color { r: number; g: number; b: number; a: number; }
interface Span  { text: string; color?: Color; }
type StyledLine = Span[];


// https://www.lua.org/manual/5.3/manual.html#6.5

/**
 * This library provides basic support for UTF-8 encoding. It provides all its
 * functions inside the table utf8. This library does not provide any support for
 * Unicode other than the handling of the encoding. Any operation that needs the
 * meaning of a character, such as character classification, is outside its scope.
 *
 * Unless stated otherwise, all functions that expect a byte position as a
 * parameter assume that the given position is either the start of a byte
 * sequence or one plus the length of the subject string. As in the string
 * library, negative indices count from the end of the string.
 * @noSelf
 * @noResolution
 * @link [utf8](https://www.lua.org/manual/5.3/manual.html#6.5)
 */
declare module "utf8" {
  /**
   * Receives zero or more integers (code points) and returns
   * their concatenated UTF-8 byte sequences as a JS string.
   */
  function char(...codepoints: number[]): string;

  /**
   * Pattern matching exactly one UTF-8 byte sequence.
   * "[\\0-\\x7F\\xC2-\\xF4][\\x80-\\xBF]*"
   */
  var charpattern: string;

  /**
   * Iterate over all UTF-8 characters in s.
   * for (const [bytePos, codePoint] of utf8.codes(s)) { … }
   * @throws if s contains invalid UTF-8.
   */
  function codes(s: string): LuaIterable<LuaMultiReturn<[number, number]>>;

  /**
   * Returns an array of code points for s[i..j].
   * Defaults: i=1, j=i
   * @throws if invalid byte sequences found.
   * @noSelf
   */
  function codepoint(s: string, i?: number, j?: number): number[];

  /**
   * Returns the number of UTF-8 characters in s[i..j].
   * Defaults: i=1, j=-1.
   * If invalid byte sequence is found, returns [false, positionOfError].
   */
  function len(s: string, i?: number, j?: number): number | [false, number];

  /**
   * Returns the byte offset where the n-th character (from i) starts.
   * n may be negative (from end). Special case: n=0 → start of char containing byte i.
   * Defaults: i = (n>=0 ? 1 : s.length+1).
   * Returns null if out of range.
   */
  function offset(s: string, n: number, i?: number): number | null;
}