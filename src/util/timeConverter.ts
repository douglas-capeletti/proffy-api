export function hourToMinute(time: string): number {

    const [hour, minutes] = time.split(':').map(Number);
    return 0 + (hour * 60) + minutes;
}