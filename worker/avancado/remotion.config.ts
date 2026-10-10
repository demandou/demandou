import { Config } from "@remotion/cli/config";

// O mesmo GL do servidor (Railway sem GPU): o 3D da 8.1 sai pelo SwiftShader.
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
