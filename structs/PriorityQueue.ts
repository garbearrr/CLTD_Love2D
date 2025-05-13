export class PriorityQueue<T> {
    private heap: T[] = [];

    /** Return true if a has *higher* priority than b. */
    private cmp: (a: T, b: T) => boolean;

    constructor(
        /** Custom order: by default this is a min-heap using `<` */
        comparator: (a: T, b: T) => boolean = (a, b) => (a as any) < (b as any)
    ) {
        this.cmp = comparator;
    }

    /* ───────── heap helpers ───────── */
    private parent(i: number) { return (i - 1) >>> 1; }   // unsigned shift = floor
    private left(i: number)   { return (i << 1) + 1; }
    private right(i: number)  { return (i << 1) + 2; }

    private swap(i: number, j: number) {
        const tmp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = tmp;
    }

    private siftUp(i: number) {
        while (i > 0) {
            const p = this.parent(i);
            if (this.cmp(this.heap[i], this.heap[p])) {
                this.swap(i, p);
                i = p;
            } else break;
        }
    }

    private siftDown(i: number) {
        while (true) {
            let best = i;
            const l = this.left(i);
            const r = this.right(i);

            if (l < this.heap.length && this.cmp(this.heap[l], this.heap[best]))
                best = l;
            if (r < this.heap.length && this.cmp(this.heap[r], this.heap[best]))
                best = r;

            if (best === i) break;
            this.swap(i, best);
            i = best;
        }
    }

    /* ───────── public API ───────── */
    /** Add an item with *O(log n)* cost. */
    enqueue(item: T): void {
        this.heap.push(item);
        this.siftUp(this.heap.length - 1);
    }

    /** Remove & return the highest-priority item, or undefined if empty. */
    dequeue(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop()!;            // non-empty by here
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.siftDown(0);
        }
        return top;
    }

    /** Look at the highest-priority item without removing it. */
    peek(): T | undefined {
        return this.heap[0];
    }

    peekAtFirst(n: number): T[] {
        return this.heap.slice(0, n);
    }

    size(): number       { return this.heap.length; }
    isEmpty(): boolean   { return this.heap.length === 0; }
    clear(): void        { this.heap.length = 0; }

    /** (Optional) replace the ordering at runtime and re-heapify */
    setComparator(comparator: (a: T, b: T) => boolean): void {
        this.cmp = comparator;
        // rebuild in O(n)
        for (let i = this.parent(this.heap.length - 1); i >= 0; --i) {
            this.siftDown(i);
        }
    }

    remove(func: (elt: T) => boolean): void {
        const idx = this.heap.findIndex(func);
        if (idx === -1) return;
    
        const last = this.heap.pop()!;
        if (idx < this.heap.length) {           // not deleting the last one
            this.heap[idx] = last;
            this.siftDown(idx);
            this.siftUp(idx);
        }
    }

    removeAll(func: (elt: T) => boolean): void {
        const idxs: number[] = [];
        this.heap.forEach((elt, idx) => {
            if (func(elt)) idxs.push(idx);
        });
    
        for (let i = idxs.length - 1; i >= 0; --i) {
            const idx = idxs[i];
            const last = this.heap.pop()!;
            if (idx < this.heap.length) {           // not deleting the last one
                this.heap[idx] = last;
                this.siftDown(idx);
                this.siftUp(idx);
            }
        }
    }
}
