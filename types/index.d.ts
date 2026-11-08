export type Limit = { percentUsed: number; resetsAt?: string }

export type LastTurn = { seconds: number; tools: number }

export type BandInfo = {
  model: string
  effort?: string
  environment: string
  isRemote: boolean
  repo?: string
  branch?: string
  session?: Limit
  weekly?: Limit
  contextPercent?: number
  startedAt?: number
  messages?: number
  lastTurn?: LastTurn
  background?: number
}

declare module 'claude-code' {
  interface PluginState {
    'status-bar': { info: BandInfo | null; isHidden: boolean; warned: string[] }
  }
}
