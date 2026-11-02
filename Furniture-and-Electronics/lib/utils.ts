export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

function toVal(mix: ClassValue): string {
  let str = "";
  if (typeof mix === "string" || typeof mix === "number") {
    str += mix;
  } else if (typeof mix === "object" && mix !== null) {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          const y = toVal(mix[k]);
          if (y) {
            str && (str += " ");
            str += y;
          }
        }
      }
    } else {
      for (const k in mix) {
        if (mix[k]) {
          str && (str += " ");
          str += k;
        }
      }
    }
  }
  return str;
}

export function clsx(...inputs: ClassValue[]): string {
  let str = "";
  for (let i = 0; i < inputs.length; i++) {
    const x = inputs[i];
    if (x) {
      const val = toVal(x);
      if (val) {
        str && (str += " ");
        str += val;
      }
    }
  }
  return str;
}

export function twMerge(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

