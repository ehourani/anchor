import { useUsageLogs } from './useUsageLogs'
import { UsageLogList } from './UsageLogList'

// Every usage log for the user, newest first.
export function AllLogsScreen() {
  const { data: logs = [], isLoading, isError } = useUsageLogs()
  return (
    <>
      <div className="mt-5">
        <h1 className="font-display text-[1.6rem] font-semibold leading-tight text-foreground">
          Skill reflections
        </h1>
        <p className="mt-1 text-sm text-foreground/50">
          A record of when you've reached for a skill.
        </p>
      </div>
      <div className="mt-4">
        <UsageLogList
          logs={logs}
          isLoading={isLoading}
          isError={isError}
          showSkill
        />
      </div>
    </>
  )
}
