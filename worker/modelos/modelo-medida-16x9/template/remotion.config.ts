import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
// o palco 3D usa WebGL: no estúdio e na linha de comando, a GPU via ANGLE
Config.setChromiumOpenGlRenderer("angle");
