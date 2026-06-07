import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

function formatTestTitle(test: TestCase) {
  const titleParts = test
    .titlePath()
    .filter((part) => part && !part.endsWith(".ts"));
  const readableParts =
    titleParts[0] === "chromium" ? titleParts.slice(1) : titleParts;

  return readableParts.join(" > ");
}

function formatDuration(duration: number) {
  return `${(duration / 1000).toFixed(1)}s`;
}

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

function colorize(color: keyof typeof colors, value: string) {
  return `${colors[color]}${value}${colors.reset}`;
}

class E2eReporter implements Reporter {
  private total = 0;
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private other = 0;

  onBegin(_config: FullConfig, suite: Suite) {
    this.total = suite.allTests().length;
    const suffix = this.total === 1 ? "test" : "tests";

    console.log(colorize("gray", `\n[e2e] Running ${this.total} ${suffix}`));
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const duration = formatDuration(result.duration);
    const title = `${formatTestTitle(test)} (${duration})`;

    if (result.status === "passed") {
      this.passed += 1;
      console.log(colorize("green", `  ✓ ${title}`));
      return;
    }

    if (result.status === "skipped") {
      this.skipped += 1;
      console.log(colorize("yellow", `  - ${title}`));
      return;
    }

    if (result.status === "failed" || result.status === "timedOut") {
      this.failed += 1;
      console.log(colorize("red", `  ✕ ${title}`));
      return;
    }

    this.other += 1;
    console.log(colorize("yellow", `  ! ${title}`));
  }

  onEnd(result: FullResult) {
    const parts = [
      `${this.passed} passed`,
      this.failed ? `${this.failed} failed` : undefined,
      this.skipped ? `${this.skipped} skipped` : undefined,
      this.other ? `${this.other} other` : undefined,
    ].filter(Boolean);
    const summary = `[e2e] ${parts.join(", ")} / ${this.total} total`;
    const color = result.status === "passed" ? "green" : "red";

    console.log(colorize(color, `${summary}\n`));
  }
}

export default E2eReporter;
