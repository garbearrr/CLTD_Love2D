export class SetStack<T> {
    private stack: T[];
    private set: Set<T>;
    private maxSize: number;
    
    constructor(maxSize = Infinity) {
        this.stack = [];
        this.set = new Set();
        this.maxSize = maxSize;
    }
    
    push(item: T): void {
        if (this.set.has(item)) {
            this.set.delete(item);
            this.stack = this.stack.filter(i => i !== item);
        }

        this.stack.push(item);
        this.set.add(item);

        if (this.stack.length > this.maxSize) {
            const removed = this.stack.shift();
            if (removed !== undefined) {
                this.set.delete(removed);
            }
        }
    }
    
    pop(): T | undefined {
        const item = this.stack.pop();
        if (item !== undefined) {
            this.set.delete(item);
        }
        return item;
    }
    
    peek(): T | undefined {
        return this.stack[this.stack.length - 1];
    }
    
    clear(): void {
        this.stack = [];
        this.set.clear();
    }
    
    size(): number {
        return this.stack.length;
    }

    itemAt(index: number): T | undefined {
        return this.stack[this.stack.length - 1 - index];
    }
}