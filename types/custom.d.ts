/* eslint-disable */

declare global {
  type Truthy<T> = Exclude<T, undefined | null | ''>
  interface BooleanConstructor {
    <T>(b: T): b is Truthy<T>
  }

  interface ObjectConstructor {
    keys<T extends object> (obj: T): Array<keyof T>
    values<T extends object> (obj: T): Array<T[keyof T]>
    entries<T extends object> (obj: T): Array<[keyof T, T[keyof T]]>
    fromEntries<T, U> (entries: Array<[T, U]>): Record<T, U>
  }

  interface String {
    toLowerCase<T extends string> (this: T): Lowercase<T>
    toUpperCase<T extends string> (this: T): Uppercase<T>
  }
}

export {}
