export type Limit = { percentUsed: number; resetsAt?: string }

export type BandInfo = {
  model: string
  effort?: string
  environment: string
  session?: Limit
  weekly?: Limit
  contextPercent?: number
}

declare module 'claude-code' {
  interface PluginState {
    'status-bar': { info: BandInfo | null }
  }
}
