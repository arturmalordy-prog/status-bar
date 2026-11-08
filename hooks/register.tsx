import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { BandInfo, Limit } from '../types'

const info = atom({ plugin: 'status-bar', key: 'info' } as const, null)

function toLimit(limits: SessionRateLimit[], kind: string): Limit | undefined {
  const found = limits.find(l => l.kind === kind)
  return found && { percentUsed: found.percentUsed, resetsAt: found.resetsAt }
}

function resetIn(iso: string | undefined, now: number): string {
  if (!iso) return ''
  const minutes = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  if (minutes >= 1440) return ` (reset ${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h)`
  if (minutes >= 60) return ` (reset ${Math.floor(minutes / 60)}h ${minutes % 60}m)`
  return ` (reset ${minutes}m)`
}

async function environmentName($: EngineInterface): Promise<string> {
  const isRemote = (await $.env.get('CLAUDE_CODE_REMOTE')) === 'true'
  if (!isRemote) return 'lokalnie'
  const type = await $.env.get('CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE')
  const entry = await $.env.get('CLAUDE_CODE_ENTRYPOINT')
  return `chmura${type ? ` · ${type}` : ''}${entry ? ` · ${entry.replace(/^remote_/, '')}` : ''}`
}

async function refresh($: EngineInterface, patch: Partial<BandInfo>): Promise<void> {
  const usage = await $.session.usage()
  const base: BandInfo = (await read($, info)) ?? {
    model: await $.session.model(),
    effort: await $.env.get('CLAUDE_EFFORT'),
    environment: await environmentName($),
  }
  const fresh: BandInfo = {
    ...base,
    session: toLimit(usage.rateLimits, 'five_hour') ?? base.session,
    weekly: toLimit(usage.rateLimits, 'seven_day') ?? base.weekly,
    contextPercent: usage.context.percent ?? base.contextPercent,
    ...patch,
  }
  await update($, info, () => fresh)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($, {
      model: await $.session.model(),
      effort: await $.env.get('CLAUDE_EFFORT'),
      environment: await environmentName($),
    })
    return result
  })

  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) {
      await refresh($, {
        model: e.model,
        effort: e.effort === undefined ? undefined : String(e.effort),
      })
    }
    return yield* next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, info, current =>
      current && {
        ...current,
        session: toLimit(e.rateLimits, 'five_hour') ?? current.session,
        weekly: toLimit(e.rateLimits, 'seven_day') ?? current.weekly,
        contextPercent: e.context.percent ?? current.contextPercent,
      },
    )
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const band = await read($, info)
    if (band === null) return next(e)

    const now = await $.clock.now()
    const pct = (l?: Limit) => (l ? `${Math.round(l.percentUsed)}%${resetIn(l.resetsAt, now)}` : '—')
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box>
        <Text dimColor>
          {`Sesja (5h): ${pct(band.session)} · Tydzień: ${pct(band.weekly)}` +
            (band.contextPercent === undefined ? '' : ` · Kontekst: ${band.contextPercent}%`) +
            ` · Środowisko: ${band.environment} · Model: ${band.model}` +
            (band.effort ? ` · Effort: ${band.effort}` : '')}
        </Text>
      </Box>
    )
  })
}
