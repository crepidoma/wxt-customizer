export const vault = {
  debug: storage.defineItem<boolean>('local:debug', {
    fallback: false,
    version: 1,
  }),
} as const;
