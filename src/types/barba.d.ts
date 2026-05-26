declare module "@barba/core" {
  interface Barba {
    init(options: Record<string, unknown>): void
    use(plugin: unknown): void
  }

  const barba: Barba
  export default barba
}

declare module "@barba/prefetch" {
  const barbaPrefetch: unknown
  export default barbaPrefetch
}
