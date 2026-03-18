import { padStart } from '@/utils/format';

export const formatToDate = (input: string | Date): string => {
    const date = typeof input === 'string' ? new Date(input) : input;
    const now = new Date();

    const isToday = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();

    if (isToday) {
        return 'Today';
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();

    return `${month} ${day}`;
};

export const formatToTime = (input: string | Date): string => {
    const date = typeof input === 'string' ? new Date(input) : input;
    const hours = padStart(date.getHours(), { length: 2, prefix: '0' });
    const minutes = padStart(date.getMinutes(), { length: 2, prefix: '0' });
    return `${hours}:${minutes}`;
};

export const getWeekRange = (base: Date) => {
    const date = new Date(base);
    const day = date.getDay();
    // Treat Monday as start of week, Sunday as end of week
    const diffToMonday = (day + 6) % 7; // 0 if Monday, 6 if Sunday
    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { startDate: monday, endDate: sunday };
};

export const getMonthRange = (base: Date) => {
    const date = new Date(base);
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    first.setHours(0, 0, 0, 0);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    last.setHours(23, 59, 59, 999);
    return { startDate: first, endDate: last };
};

export const getYearRange = (base: Date) => {
    const first = new Date(base.getFullYear(), 0, 1);
    first.setHours(0, 0, 0, 0);
    const last = new Date(base.getFullYear(), 11, 31);
    last.setHours(23, 59, 59, 999);
    return { startDate: first, endDate: last };
};
