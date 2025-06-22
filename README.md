# Night City Navigator

Night City Navigator is a companion tool/mod for Cyberpunk 2077 to connect to an external street map of Night City.

## Getting Started

### Installation

Requirements:
 - [RED4ext](https://docs.red4ext.com/getting-started/installing-red4ext)

1. Find the latest release on the [Releases](https://github.com/ceepu45/nightcitynavigator/releases) page.
2. Download 'ncn-gpsmod-\<version\>.zip', and either extract it into your Cyberpunk 2077 game directory, or install it using your mod manager.
3. Download 'nightcitynavigator-\<version\>-windows.zip', and extract to somewhere convenient (NOT your game directory).

### Usage
1. Launch the game
2. From where you extracted the night city navigator files, run "nightcitynavigator.exe".
    This should open a terminal window when the server starts.
3. Open the website in a browser.
    - To open the map on your desktop, open a web browser to <http://localhost:3000>.
    - To open the map on another device (like your phone), find your desktop's ip address, then go to http://<your.ip.address.here>:3000.
4. you should see Night City map, with a marker indicating your player position.


## Building from source

To build from source, the following tools are required:

 - Cargo
 - npm
 - CMake
 - Some CMake generator like Make or Ninja

### Cloning from git

Make sure to check out submodules when cloning from git:
```console
$ git clone --recurse-submodules https://github.com/ceepu45/nightcitynavigator.git
```

### Application Files

First, build the server:
```console
$ cargo build
```

Then, build the web files:
```console
$ cd client
$ npm install
$ npm run build
```

### Mod Files

```console
$ cd mod
$ cmake -B build
$ cmake --build build
```
