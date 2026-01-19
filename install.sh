#!/usr/bin/env bash
set -euo pipefail

print_header() {
  printf "\n== %s ==\n" "$1"
}

print_note() {
  printf " - %s\n" "$1"
}

install_linux_deps() {
  if command -v apt-get >/dev/null 2>&1; then
    print_header "Installing Linux dependencies (apt)"
    sudo apt-get update
    sudo apt-get install -y \
      build-essential \
      pkg-config \
      libssl-dev \
      libgtk-3-dev \
      libwebkit2gtk-4.1-dev \
      libayatana-appindicator3-dev \
      librsvg2-dev \
      patchelf || {
        print_note "Retrying with libwebkit2gtk-4.0-dev for older distros"
        sudo apt-get install -y \
          libwebkit2gtk-4.0-dev
      }
    return
  fi

  if command -v dnf >/dev/null 2>&1; then
    print_header "Installing Linux dependencies (dnf)"
    sudo dnf install -y \
      gcc \
      gcc-c++ \
      make \
      pkgconf-pkg-config \
      openssl-devel \
      gtk3-devel \
      webkit2gtk4.1-devel \
      libappindicator-gtk3-devel \
      librsvg2-devel \
      patchelf
    return
  fi

  if command -v pacman >/dev/null 2>&1; then
    print_header "Installing Linux dependencies (pacman)"
    sudo pacman -S --needed --noconfirm \
      base-devel \
      pkgconf \
      openssl \
      gtk3 \
      webkit2gtk-4.1 \
      libappindicator-gtk3 \
      librsvg \
      patchelf
    return
  fi

  if command -v zypper >/dev/null 2>&1; then
    print_header "Installing Linux dependencies (zypper)"
    sudo zypper install -y \
      gcc \
      gcc-c++ \
      make \
      pkg-config \
      libopenssl-devel \
      gtk3-devel \
      webkit2gtk3-devel \
      libappindicator3-devel \
      librsvg-devel \
      patchelf
    return
  fi

  if command -v apk >/dev/null 2>&1; then
    print_header "Installing Linux dependencies (apk)"
    sudo apk add --no-cache \
      build-base \
      pkgconfig \
      openssl-dev \
      gtk+3.0-dev \
      webkit2gtk-dev \
      libappindicator-gtk3-dev \
      librsvg-dev \
      patchelf
    return
  fi

  print_header "Unsupported Linux distribution"
  print_note "Install GTK3, WebKit2GTK, librsvg, OpenSSL, and patchelf using your package manager."
}

install_macos_deps() {
  print_header "Checking Xcode Command Line Tools"
  if ! xcode-select -p >/dev/null 2>&1; then
    print_note "Installing Xcode Command Line Tools (a dialog may appear)"
    xcode-select --install
  else
    print_note "Xcode Command Line Tools already installed"
  fi

  if command -v brew >/dev/null 2>&1; then
    print_header "Installing macOS dependencies (Homebrew)"
    brew install pkg-config
  else
    print_header "Homebrew not found"
    print_note "Install Homebrew from https://brew.sh and re-run this script if you want pkg-config."
  fi
}

check_dev_tools() {
  print_header "Checking developer tools"

  local missing=()
  for tool in node npm cargo rustc; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      missing+=("$tool")
    fi
  done

  if [ "${#missing[@]}" -eq 0 ]; then
    print_note "Node.js and Rust toolchains are available"
    return
  fi

  print_note "Missing tools: ${missing[*]}"
  print_note "Install Node.js (>=18) and Rust (rustup) before running the app."
}

main() {
  case "$(uname -s)" in
    Linux)
      install_linux_deps
      ;;
    Darwin)
      install_macos_deps
      ;;
    *)
      print_header "Unsupported OS"
      print_note "This script supports Linux and macOS only."
      ;;
  esac

  check_dev_tools
  print_header "Done"
  print_note "Next: npm install"
}

main "$@"
