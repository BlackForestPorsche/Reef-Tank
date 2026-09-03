#pragma once

// Community GPIO map for Guition / Sunton ESP32-S3-4848S040
// (4.0" 480x480, ST7701 RGB + GT911, no-relay SKU).
//
// Sources (do not invent pins):
//   Arduino_GFX issue #684 (GUITION wiki snippet)
//   ESPHome devices.esphome.io/devices/guition-esp32-s3-4848s040
//   HomeDing boards/esp32s3/panel-4848S040
//   davidegat/ESP32-4848S040-Fun
//
// Older Sunton blurbs sometimes list touch I2C as 19/20. GPIO20 is RGB G1
// on every RGB map above — use SDA=19 SCL=45. Full write-up: docs/4848S040.md.
//
// Default firmware (env esp32-s3-panel) drives these pins via Arduino_GFX + GT911.
// env esp32-s3-panel-serial compiles without those libraries.

#define PANEL_HRES 480
#define PANEL_VRES 480

#define TFT_BL 38

#define TFT_CS 39
#define TFT_SCK 48
#define TFT_MOSI 47
#define TFT_RST -1

#define TFT_DE 18
#define TFT_VSYNC 17
#define TFT_HSYNC 16
#define TFT_PCLK 21

#define TFT_R0 11
#define TFT_R1 12
#define TFT_R2 13
#define TFT_R3 14
#define TFT_R4 0

#define TFT_G0 8
#define TFT_G1 20
#define TFT_G2 3
#define TFT_G3 46
#define TFT_G4 9
#define TFT_G5 10

#define TFT_B0 4
#define TFT_B1 5
#define TFT_B2 6
#define TFT_B3 7
#define TFT_B4 15

#define TFT_HSYNC_POLARITY 1
#define TFT_HSYNC_FRONT_PORCH 10
#define TFT_HSYNC_PULSE_WIDTH 8
#define TFT_HSYNC_BACK_PORCH 50
#define TFT_VSYNC_POLARITY 1
#define TFT_VSYNC_FRONT_PORCH 10
#define TFT_VSYNC_PULSE_WIDTH 8
#define TFT_VSYNC_BACK_PORCH 20
#define TFT_PCLK_ACTIVE_NEG 0
#define TFT_PREFER_SPEED 12000000

#define TOUCH_SDA 19
#define TOUCH_SCL 45
#define TOUCH_INT -1
#define TOUCH_RST -1
#define TOUCH_ADDR 0x5D
#define TOUCH_I2C_FREQ 400000
#define TOUCH_ROTATION 1

// Relay SKU only (GPIO 40 / 2 / 1). Leave floating on the no-relay panel.
// microSD (unused in 0.1.1): CS 42, MISO 41, MOSI 47, SCK 48.
