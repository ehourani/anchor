import type { Skill } from '@/features/skills/sampleSkills'
import { useUsageLogs } from './useUsageLogs'
import { UsageLogList } from './UsageLogList'

// One skill's usage history, newest first. Reached from the skill detail; shares
// the same query (cache key) so it opens instantly.
export function SkillLogsScreen({ skill }: { skill: Skill }) {
  const { data: logs = [], isLoading, isError } = useUsageLogs(skill.id)
  return (
    <>
      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-foreground/45">
          Reflections
        </p>
        <h1 className="mt-1 font-display text-[1.6rem] font-semibold leading-tight text-foreground">
          {skill.title}
        </h1>
      </div>
      <div className="mt-4">
        <UsageLogList
          logs={logs}
          isLoading={isLoading}
          isError={isError}
          showSkill={false}
        />
      </div>
    </>
  )
}
