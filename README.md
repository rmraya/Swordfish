# Swordfish

![Swordfish logo](icons/icon.png)

An advanced CAT (Computer Aided Translation) tool based on XLIFF Standard that supports MS Office, DITA, HTML and other document formats.

Swordfish uses TM (Translation Memory) and MT (Machine Translation). Supports segment filtering, terminology, customization and more.

## Swordfish Videos
- [Build Swordfish from Source Code](https://youtu.be/VQveu4BLElE)
- [Translate a Segment Using the AI Prompt Dialog](https://youtu.be/VQveu4BLElE)
- [Translate a Segment Using the AI Menu or Keyboard Shortcuts](https://youtu.be/FwsFZCjUajU)

## Licenses

Swordfish is available in two modes:

- Source Code
- Yearly Subscriptions for installers and support

### Source Code

Source code of Swordfish is free. Anyone can download the source code, compile, modify and use it at no cost in compliance with the accompanying license terms.

You can subscribe to [Maxprograms Support](https://groups.io/g/maxprograms/) at Groups.io and request peer assistance for the source code version there.

### Subscriptions

The version of Swordfish included in the official installers from [Maxprograms Download Page](https://www.maxprograms.com/downloads/index.html) can be used at no cost for 30 days requesting a free Evaluation Key.

Personal Subscription Keys are available in  [Maxprograms Online Store](https://www.maxprograms.com/store/buy.html). Subscription Keys cannot be shared or transferred to different machines.

Subscription version includes unlimited email support at [tech@maxprograms.com](mailto:tech@maxprograms.com)

### Differences sumary

Differences | Source Code | Subscription Based
------------|:-----------:|:-----------------:
Ready To Use Installers| No | Yes
Notarized macOS launcher| No | Yes
Signed launcher and installer for Windows | No | Yes
Restricted Features | None | None
Technical Support |  Peer support at [Groups.io](https://groups.io/g/maxprograms/)| - Direct email at [tech@maxprograms.com](mailto:tech@maxprograms.com)  <br> - Peer support at [Groups.io](https://groups.io/g/maxprograms/)

## Related Projects

- [RemoteTM](https://github.com/rmraya/RemoteTM)
- [OpenXLIFF Filters](https://github.com/rmraya/OpenXLIFF)

## Requirements

- JDK 21 or newer is required for compiling and building. Get it from [Adoptium](https://adoptium.net/).
- Apache Ant 1.10.14 or newer. Get it from [https://ant.apache.org/](https://ant.apache.org/)
- Node.js 22.13.0 LTS or newer. Get it from [https://nodejs.org/](https://nodejs.org/)
- TypeScript 5.7.3 or newer, get it from [https://www.typescriptlang.org/](https://www.typescriptlang.org/)

## Building

- Checkout this repository.
- Point your `JAVA_HOME` environment variable to JDK 21
- Run `ant` to compile the Java code
- Run `npm install` to download and install NodeJS dependencies
- Run `npm start` to launch Swordfish

### Steps for building

``` bash
  git clone https://github.com/rmraya/Swordfish.git
  cd Swordfish
  ant
  npm install
  npm start
```

Compile once and then simply run `npm start` to start Swordfish.
