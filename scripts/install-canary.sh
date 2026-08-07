#!/bin/sh
set -eu

REPO="leoreisdias/plannotator"
INSTALL_DIR="$HOME/.local/bin"

case "$(uname -s)" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  *)
    echo "Unsupported operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

case "$(uname -m)" in
  x86_64|amd64) arch="x64" ;;
  arm64|aarch64) arch="arm64" ;;
  *)
    echo "Unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

binary_name="plannotator-${os}-${arch}"
release_url="https://github.com/${REPO}/releases/latest/download"
binary_url="${release_url}/${binary_name}"
checksum_url="${binary_url}.sha256"

mkdir -p "$INSTALL_DIR"
tmp_dir=$(mktemp -d "${INSTALL_DIR}/.plannotator-canary.XXXXXX")
trap 'rm -rf "$tmp_dir"' EXIT HUP INT TERM
tmp_binary="${tmp_dir}/${binary_name}"

echo "Downloading the latest Plannotator canary for ${os}-${arch}..."
curl -fsSL --connect-timeout 10 --max-time 300 -o "$tmp_binary" "$binary_url"
expected_checksum=$(curl -fsSL --connect-timeout 10 --max-time 60 "$checksum_url" | awk '{print $1}')

if [ "$os" = "darwin" ]; then
  actual_checksum=$(shasum -a 256 "$tmp_binary" | awk '{print $1}')
else
  actual_checksum=$(sha256sum "$tmp_binary" | awk '{print $1}')
fi

if [ -z "$expected_checksum" ] || [ "$actual_checksum" != "$expected_checksum" ]; then
  echo "Checksum verification failed; refusing to install the canary binary." >&2
  exit 1
fi

target="${INSTALL_DIR}/plannotator"
mv -f "$tmp_binary" "$target"
chmod +x "$target"

echo "SHA-256 verified. Plannotator canary installed to ${target}."
"$target" install-runtime agent-terminal
