# Android Termux setup

This guide runs SolSeeker-Engine as a background daemon on Android. Use the
official Termux builds from F-Droid; the Play Store build is not supported.

## Install

Install **Termux** and **Termux:API** from F-Droid, open Termux, then run:

```sh
pkg update && pkg upgrade
pkg install git nodejs termux-api
git clone https://github.com/0xalydev/SolSeeker-Engine.git
cd SolSeeker-Engine
npm test
node bin/solseeker.js status
```

## Start at boot

Install **Termux:Boot** from F-Droid and start it once. Create the boot script:

```sh
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/solseeker <<'EOF'
#!/data/data/com.termux/files/usr/bin/sh
termux-wake-lock
cd "$HOME/SolSeeker-Engine"
node bin/solseeker.js start >> "$HOME/solseeker.log" 2>&1
EOF
chmod +x ~/.termux/boot/solseeker
```

Restart the phone to verify that the daemon starts. Check the log with
`tail -f ~/solseeker.log` and stop the wake lock with `termux-wake-unlock`.

## Battery settings

Android may stop long-running processes. Set Termux and Termux:Boot to
**Unrestricted** battery usage, allow background activity, and disable the
vendor's automatic battery or memory cleanup for both apps. On MIUI, One UI,
and OxygenOS these controls are usually under the app battery settings.

The exact menu names depend on the Android version and device manufacturer.
