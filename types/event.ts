export type EventListener<T> = (event: T) => void;
export type EventSubscription = () => void;

export interface Event<T> {
    on(listener: EventListener<T>): EventSubscription;
    once(listener: EventListener<T>): EventSubscription;
    off(listener: EventListener<T>): void;
    emit(event: T): void;
}
