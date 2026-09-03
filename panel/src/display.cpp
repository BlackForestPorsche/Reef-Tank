#include "display.h"
#include "pins.h"
#include "reefdeck.h"
#include "ui.h"
#include <Arduino.h>

#ifdef REEFDECK_HAS_DISPLAY

#include <Arduino_GFX_Library.h>
#include <TAMC_GT911.h>
#include <Wire.h>
#include <esp_heap_caps.h>
#include <lvgl.h>

static Arduino_DataBus *bus = nullptr;
static Arduino_ESP32RGBPanel *rgbpanel = nullptr;
static Arduino_RGB_Display *gfx = nullptr;
static TAMC_GT911 *touch = nullptr;
static bool ready = false;
static lv_disp_draw_buf_t drawBuf;
static lv_disp_drv_t dispDrv;
static lv_indev_drv_t indevDrv;
static lv_color_t *lvBuf = nullptr;
static uint32_t pressStarted = 0;
static bool longFired = false;

static void flush_cb(lv_disp_drv_t *disp, const lv_area_t *area, lv_color_t *color_p) {
  if (!gfx) {
    lv_disp_flush_ready(disp);
    return;
  }
  uint32_t w = (uint32_t)(area->x2 - area->x1 + 1);
  uint32_t h = (uint32_t)(area->y2 - area->y1 + 1);
  gfx->draw16bitRGBBitmap(area->x1, area->y1, (uint16_t *)color_p, w, h);
  lv_disp_flush_ready(disp);
}

static void touch_cb(lv_indev_drv_t * /*drv*/, lv_indev_data_t *data) {
  if (!touch) {
    data->state = LV_INDEV_STATE_REL;
    return;
  }
  touch->read();
  if (touch->isTouched) {
    data->state = LV_INDEV_STATE_PR;
    data->point.x = touch->points[0].x;
    data->point.y = touch->points[0].y;
    if (pressStarted == 0) pressStarted = millis();
    if (!longFired && millis() - pressStarted >= (uint32_t)REEFDECK_HOLD_PAIR_MS) {
      longFired = true;
      ui_on_long_press();
    }
  } else {
    data->state = LV_INDEV_STATE_REL;
    pressStarted = 0;
    longFired = false;
  }
}

bool display_begin() {
  pinMode(TFT_BL, OUTPUT);
  digitalWrite(TFT_BL, HIGH);

  bus = new Arduino_SWSPI(GFX_NOT_DEFINED /* DC */, TFT_CS, TFT_SCK, TFT_MOSI, GFX_NOT_DEFINED /* MISO */);
  rgbpanel = new Arduino_ESP32RGBPanel(
      TFT_DE, TFT_VSYNC, TFT_HSYNC, TFT_PCLK, TFT_R0, TFT_R1, TFT_R2, TFT_R3, TFT_R4, TFT_G0, TFT_G1,
      TFT_G2, TFT_G3, TFT_G4, TFT_G5, TFT_B0, TFT_B1, TFT_B2, TFT_B3, TFT_B4, TFT_HSYNC_POLARITY,
      TFT_HSYNC_FRONT_PORCH, TFT_HSYNC_PULSE_WIDTH, TFT_HSYNC_BACK_PORCH, TFT_VSYNC_POLARITY,
      TFT_VSYNC_FRONT_PORCH, TFT_VSYNC_PULSE_WIDTH, TFT_VSYNC_BACK_PORCH);
  // st7701_type1 = Arduino_GFX wiki for this Guition panel. White screen: try type9.
  gfx = new Arduino_RGB_Display(PANEL_HRES, PANEL_VRES, rgbpanel, 0 /* rotation */, true /* auto_flush */,
                                bus, TFT_RST, st7701_type1_init_operations, sizeof(st7701_type1_init_operations));

  if (!gfx || !gfx->begin()) {
    Serial.println("display: Arduino_GFX begin failed — serial UI only");
    ready = false;
    return false;
  }
  gfx->fillScreen(BLACK);

  lv_init();
  const uint32_t lines = 40;
  const size_t px = (size_t)PANEL_HRES * lines;
  lvBuf = (lv_color_t *)heap_caps_malloc(px * sizeof(lv_color_t), MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT);
  if (!lvBuf) lvBuf = (lv_color_t *)heap_caps_malloc(px * sizeof(lv_color_t), MALLOC_CAP_INTERNAL | MALLOC_CAP_8BIT);
  if (!lvBuf) {
    Serial.println("display: LVGL buffer alloc failed — serial UI only");
    ready = false;
    return false;
  }
  lv_disp_draw_buf_init(&drawBuf, lvBuf, nullptr, px);
  lv_disp_drv_init(&dispDrv);
  dispDrv.hor_res = PANEL_HRES;
  dispDrv.ver_res = PANEL_VRES;
  dispDrv.flush_cb = flush_cb;
  dispDrv.draw_buf = &drawBuf;
  lv_disp_drv_register(&dispDrv);

  Wire.begin(TOUCH_SDA, TOUCH_SCL);
  Wire.setClock(TOUCH_I2C_FREQ);
  touch = new TAMC_GT911(TOUCH_SDA, TOUCH_SCL, TOUCH_INT, TOUCH_RST, PANEL_HRES, PANEL_VRES);
  if (touch) {
    touch->begin(TOUCH_ADDR);
    touch->setRotation(TOUCH_ROTATION);
    lv_indev_drv_init(&indevDrv);
    indevDrv.type = LV_INDEV_TYPE_POINTER;
    indevDrv.read_cb = touch_cb;
    lv_indev_drv_register(&indevDrv);
  } else {
    Serial.println("display: GT911 alloc failed — touch off, glass still paints");
  }

  ready = true;
  Serial.println("display: LVGL ready (4848S040 community pin map)");
  return true;
}

void display_loop() {
  if (ready) lv_timer_handler();
}

bool display_ready() { return ready; }

#else

bool display_begin() {
  Serial.println("display: stub (no REEFDECK_HAS_DISPLAY). Dummy UI is /panel");
  return false;
}

void display_loop() {}

bool display_ready() { return false; }

#endif
