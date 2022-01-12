import { format } from "date-fns";

export function formatTime(src: number) {
    return format(src * 1000, 'hh:mm aa');
}