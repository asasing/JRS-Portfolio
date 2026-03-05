"use client";

const PROBLEMS = [
  "Teams relying heavily on spreadsheets to manage operations",
  "Manual approval workflows slowing down processes",
  "Disconnected business tools causing poor visibility",
  "CRM systems lacking automation and integrations",
  "Internal reporting requiring excessive manual effort",
];

interface CommonOperationalProblemsProps {
  problems?: string[];
}

export default function CommonOperationalProblems({
  problems = [],
}: CommonOperationalProblemsProps) {
  const displayProblems = problems.length > 0 ? problems : PROBLEMS;

  return (
    <section id="problems" className="portfolio-section">
      <div className="site-container">
        <div className="rounded-2xl border border-border-subtle bg-bg-card px-6 py-7 md:px-8 md:py-8">
          <h3 className="text-xs uppercase tracking-[0.3em] text-text-muted flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-accent-purple" />
            OPERATIONAL PAIN POINTS
          </h3>
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            Common Operational Problems I Help Solve
          </h2>

          <ul className="mt-5 space-y-3 text-sm md:text-base text-text-secondary leading-relaxed">
            {displayProblems.map((problem) => (
              <li key={problem} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent-purple shrink-0" />
                <span>{problem}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
