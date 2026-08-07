import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const scriptsDir = import.meta.dir;
const fakeBinary = `#!/bin/sh
printf '%s\n' "$*" >> "$HOME/runtime-invocations"
`;
const fakeBinaryChecksum = createHash("sha256").update(fakeBinary).digest("hex");

function setupSandbox(checksum = fakeBinaryChecksum) {
  const root = mkdtempSync(join(tmpdir(), "plannotator-canary-install-test-"));
  const home = join(root, "home");
  const stubBin = join(root, "stub-bin");
  const installDir = join(home, ".local", "bin");
  mkdirSync(join(home, "tmp"), { recursive: true });
  mkdirSync(stubBin, { recursive: true });
  mkdirSync(installDir, { recursive: true });

  const stablePath = join(installDir, "plannotator-stable");
  writeFileSync(stablePath, "old stable binary\n", { mode: 0o755 });
  symlinkSync("plannotator-stable", join(installDir, "plannotator"));

  writeFileSync(
    join(stubBin, "uname"),
    `#!/bin/sh
case "$1" in
  -s) printf 'Darwin\n' ;;
  -m) printf 'arm64\n' ;;
  *) exit 1 ;;
esac
`,
    { mode: 0o755 },
  );

  writeFileSync(
    join(stubBin, "curl"),
    `#!/bin/sh
out=""
url=""
prev=""
for arg in "$@"; do
  if [ "$prev" = "-o" ]; then out="$arg"; fi
  case "$arg" in
    http*) url="$arg" ;;
  esac
  prev="$arg"
done
printf '%s\n' "$url" >> "$HOME/curl-urls"
case "$url" in
  *plannotator-darwin-arm64.sha256) printf '%s  plannotator-darwin-arm64\n' "$STUB_CHECKSUM" ;;
  *plannotator-darwin-arm64) printf '%s' "$STUB_BINARY" > "$out" ;;
  *) exit 22 ;;
esac
`,
    { mode: 0o755 },
  );

  return { home, installDir, stubBin, checksum };
}

function runInstaller(sandbox: ReturnType<typeof setupSandbox>) {
  const result = Bun.spawnSync(["bash", join(scriptsDir, "install-canary.sh")], {
    env: {
      HOME: sandbox.home,
      TMPDIR: join(sandbox.home, "tmp"),
      PATH: `${sandbox.stubBin}:/usr/bin:/bin`,
      STUB_BINARY: fakeBinary,
      STUB_CHECKSUM: sandbox.checksum,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  return {
    code: result.exitCode,
    output: result.stdout.toString() + result.stderr.toString(),
  };
}

describe.skipIf(process.platform === "win32")("install-canary.sh", () => {
  test("installs the latest fork canary as the single active binary", () => {
    const sandbox = setupSandbox();

    const result = runInstaller(sandbox);

    expect(result.code).toBe(0);
    const installedPath = join(sandbox.installDir, "plannotator");
    expect(existsSync(installedPath)).toBe(true);
    expect(lstatSync(installedPath).isSymbolicLink()).toBe(false);
    expect(readFileSync(installedPath, "utf8")).toBe(fakeBinary);
    expect(readFileSync(join(sandbox.home, "runtime-invocations"), "utf8")).toBe(
      "install-runtime agent-terminal\n",
    );
    expect(readFileSync(join(sandbox.home, "curl-urls"), "utf8")).toContain(
      "https://github.com/leoreisdias/plannotator/releases/latest/download/plannotator-darwin-arm64",
    );
    expect(readFileSync(join(sandbox.installDir, "plannotator-stable"), "utf8")).toBe(
      "old stable binary\n",
    );
  });

  test("leaves the active binary untouched when checksum verification fails", () => {
    const sandbox = setupSandbox("0".repeat(64));

    const result = runInstaller(sandbox);

    expect(result.code).toBe(1);
    expect(result.output).toContain("Checksum verification failed; refusing to install");
    const installedPath = join(sandbox.installDir, "plannotator");
    expect(lstatSync(installedPath).isSymbolicLink()).toBe(true);
    expect(readlinkSync(installedPath)).toBe("plannotator-stable");
    expect(existsSync(join(sandbox.home, "runtime-invocations"))).toBe(false);
  });
});
