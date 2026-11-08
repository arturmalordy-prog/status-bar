import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionRateLimit } from 'claude-code'

import type { BandInfo, Limit } from '../types'

const info = atom({ plugin: 'status-bar', key: 'info' } as const, null)
const isHidden = atom({ plugin: 'status-bar', key: 'isHidden' } as const, false)
const warned = atom({ plugin: 'status-bar', key: 'warned' } as const, [])

const WARN_AT = 70
const ALERT_AT = 90

function toLimit(limits: SessionRateLimit[], kind: string): Limit | undefined {
  const found = limits.find(l => l.kind === kind)
  return found && { percentUsed: found.percentUsed, resetsAt: found.resetsAt }
}

function duration(minutes: number): string {
  if (minutes >= 1440) return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
  return `${minutes}m`
}

function resetIn(iso: string | undefined, now: number): string {
  if (!iso) return ''
  return ` ↻${duration(Math.max(0, Math.round((Date.parse(iso) - now) / 60000)))}`
}

function levelColor(percent: number | undefined): string {
  if (percent === undefined) return 'subtle'
  if (percent >= ALERT_AT) return 'error'
  if (percent >= WARN_AT) return 'warning'
  return 'success'
}

function levelIcon(percent: number | undefined): string {
  if (percent === undefined) return '⚪'
  if (percent >= ALERT_AT) return '🔴'
  if (percent >= WARN_AT) return '🟡'
  return '🟢'
}

async function environmentInfo($: EngineInterface): Promise<{ environment: string; isRemote: boolean }> {
  const isRemote = (await $.env.get('CLAUDE_CODE_REMOTE')) === 'true'
  if (!isRemote) return { environment: 'lokalnie', isRemote }
  const type = await $.env.get('CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE')
  const entry = await $.env.get('CLAUDE_CODE_ENTRYPOINT')
  const parts = ['chmura', type, entry?.replace(/^remote_/, '')].filter(Boolean)
  return { environment: parts.join(' · '), isRemote }
}

async function gitInfo($: EngineInterface): Promise<{ repo?: string; branch?: string }> {
  const repo = await $.session.repo()
  if (repo === null) return {}
  const name = (repo.remote ?? repo.root).replace(/\.git$/, '').split(/[/:]/).pop()
  try {
    const { exitCode, stdout } = await $.process.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: repo.root,
      timeoutMs: 5000,
    })
    return { repo: name, branch: exitCode === 0 ? stdout.trim() : undefined }
  } catch {
    return { repo: name }
  }
}

async function backgroundCount($: EngineInterface): Promise<number> {
  const agents = await $.agent.list()
  return agents.filter(a => a.status === 'running' || a.status === 'pending' || a.status === 'waiting').length
}

async function warnLimits($: EngineInterface, limits: SessionRateLimit[]): Promise<void> {
  const already = await read($, warned)
  for (const limit of limits) {
    const tag = `${limit.kind}@${limit.resetsAt ?? ''}`
    if (limit.percentUsed >= ALERT_AT && !already.includes(tag)) {
      const label = limit.kind === 'seven_day' ? 'tygodniowy' : limit.kind === 'five_hour' ? 'sesji (5h)' : limit.kind
      $.ui.toast(`⚠️ Limit ${label}: ${Math.round(limit.percentUsed)}% wykorzystane`)
      await update($, warned, list => [...list, tag])
    }
  }
}

async function refresh($: EngineInterface, patch: Partial<BandInfo>): Promise<void> {
  const usage = await $.session.usage()
  const base: BandInfo = (await read($, info)) ?? {
    model: await $.session.model(),
    effort: await $.env.get('CLAUDE_EFFORT'),
    ...(await environmentInfo($)),
  }
  const fresh: BandInfo = {
    ...base,
    session: toLimit(usage.rateLimits, 'five_hour') ?? base.session,
    weekly: toLimit(usage.rateLimits, 'seven_day') ?? base.weekly,
    contextPercent: usage.context.percent ?? base.contextPercent,
    startedAt: usage.startedAt,
    messages: await $.session.turns(),
    background: await backgroundCount($),
    ...patch,
  }
  await update($, info, () => fresh)
  await warnLimits($, usage.rateLimits)
}

export const register: Register = on => {
  let turnStartedAt = 0
  let turnTools = 0

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($, {
      model: await $.session.model(),
      effort: await $.env.get('CLAUDE_EFFORT'),
      ...(await environmentInfo($)),
      ...(await gitInfo($)),
    })
    return result
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      turnStartedAt = await $.clock.now()
      turnTools = 0
      await refresh($, await gitInfo($))
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId === undefined) turnTools += 1
    return next(e)
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

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    if (e.agentId === undefined && turnStartedAt > 0) {
      const seconds = Math.round(((await $.clock.now()) - turnStartedAt) / 1000)
      await refresh($, { lastTurn: { seconds, tools: turnTools }, ...(await gitInfo($)) })
    } else {
      await refresh($, {})
    }
    return result
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
    await warnLimits($, e.rateLimits)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const band = await read($, info)
    if (band === null) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const background = e.surface === 'terminal' ? '#3a3a3a' : '#8080802e'

    if (await read($, isHidden)) {
      return (
        <Box>
          <Button key="show" label="📊 Pokaż pasek" onPress={() => update($, isHidden, () => false)} />
        </Box>
      )
    }

    const now = await $.clock.now()
    const pct = (l?: Limit) => (l ? `${Math.round(l.percentUsed)}%${resetIn(l.resetsAt, now)}` : '—')
    const items: { key: string; text: string; color: string }[] = [
      { key: 's', text: `${levelIcon(band.session?.percentUsed)} 5h ${pct(band.session)}`, color: levelColor(band.session?.percentUsed) },
      { key: 'w', text: `📅 Tydz. ${pct(band.weekly)}`, color: levelColor(band.weekly?.percentUsed) },
      { key: 'c', text: `🧠 Kontekst ${band.contextPercent === undefined ? '—' : `${band.contextPercent}%`}`, color: levelColor(band.contextPercent) },
      { key: 'e', text: `${band.isRemote ? '☁️' : '💻'} ${band.environment}`, color: 'suggestion' },
    ]
    if (band.repo) {
      items.push({ key: 'g', text: `🌿 ${band.repo}${band.branch ? ` · ${band.branch}` : ''}`, color: 'diffAdded' })
    }
    items.push({ key: 'm', text: `🤖 ${band.model}${band.effort ? ` ⚡${band.effort}` : ''}`, color: 'claude' })
    if (band.startedAt !== undefined) {
      const minutes = Math.max(0, Math.round((now - band.startedAt) / 60000))
      items.push({ key: 't', text: `⏱️ ${duration(minutes)} · 💬 ${band.messages ?? 0}`, color: 'text' })
    }
    if (band.lastTurn) {
      items.push({ key: 'l', text: `🔄 ${band.lastTurn.seconds}s · 🔧 ${band.lastTurn.tools}`, color: 'text' })
    }
    if (band.background) {
      items.push({ key: 'b', text: `⚙️ ${band.background} w tle`, color: 'warning' })
    }

    return (
      <Box flexDirection="row" flexWrap="wrap" columnGap={2} paddingX={1} backgroundColor={background} alignItems="center">
        {items.map(item => (
          <Text key={item.key} color={item.color}>
            {item.text}
          </Text>
        ))}
        <Button key="hide" label="✕ Ukryj" onPress={() => update($, isHidden, () => true)} />
      </Box>
    )
  })
}
