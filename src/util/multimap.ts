export class MultiMap<K, V> {
    map = new Map<K, Set<V>>();

    add(key: K, value: V) {
        const set = this.map.get(key) ?? new Set();
        set.add(value);
        this.map.set(key, set);
    }

    get(key: K): Set<V> {
        return this.map.get(key) ?? new Set();
    }

    delete(key: K, value: V) {
        const set = this.map.get(key);
        return set ? set.delete(value) : false;
    }

    deleteAll(key: K) {
        this.map.delete(key);
    }

    deleteValue(value: V) {
        for (const g of this.groups()) {
            g.delete(value);
        }
    }

    clear() {
        this.map.clear();
    }

    keys(): IterableIterator<K> {
        return this.map.keys();
    }

    groups(): IterableIterator<Set<V>> {
        return this.map.values();
    }
}
