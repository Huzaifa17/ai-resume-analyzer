import type {Class} from "estree";

import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


const SIZE_UNITS = ["KB", "MB", "GB"] as const;
const BYTES_PER_KILOBYTE = 1024;



export const formatSize = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return "0 Bytes";
    }

    let value = bytes / BYTES_PER_KILOBYTE;
    let unitIndex = 0;

    while (value >= BYTES_PER_KILOBYTE && unitIndex < SIZE_UNITS.length - 1) {
        value /= BYTES_PER_KILOBYTE;
        unitIndex += 1;
    }

    const formattedValue = value.toFixed(2);

    return `${formattedValue} ${SIZE_UNITS[unitIndex]}`;
};



export const generateUUID = () => crypto.randomUUID();