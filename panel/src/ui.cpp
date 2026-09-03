#include "ui.h"
#include "config.h"
#include "display.h"
#include "net.h"
#include "pins.h"
#include "reefdeck.h"
#include <Arduino.h>
#include <stdio.h>
#include <string.h>

#ifdef REEFDECK_HAS_DISPLAY
#include <lvgl.h>
#endif

static bool pairing = true;
static enum { PAGE_PAIR, PAGE_HOME, PAGE_FEED } page = PAGE_PAIR;
static GlanceState last = {};
static bool have_glance = false;
static char statusLine[64];
static unsigned long lastPairBanner = 0;

#ifdef REEFDECK_HAS_DISPLAY
static lv_obj_t *scr_pair = nullptr;
static lv_obj_t *scr_home = nullptr;
static lv_obj_t *scr_feed = nullptr;
static lv_obj_t *pair_code = nullptr;
static lv_obj_t *pair_ssid = nullptr;
static lv_obj_t *pair_status = nullptr;
static lv_obj_t *pair_ver = nullptr;
static lv_obj_t *home_tank = nullptr;
static lv_obj_t *home_live = nullptr;
static lv_obj_t *home_banner = nullptr;
static lv_obj_t *home_probe_name[4] = {};
static lv_obj_t *home_probe_val[4] = {};
static lv_obj_t *home_probe_unit[4] = {};
static lv_obj_t *feed_card[4] = {};
static lv_obj_t *feed_letter[4] = {};
static lv_obj_t *feed_label[4] = {};
static lv_obj_t *feed_remain = nullptr;

static const char *kFeedNames[4] = {"Feeding", "Water change", "Maintenance", "Custom"};
static const char *kFeedLetters[4] = {"A", "B", "C", "D"};

static lv_color_t col_bg() { return lv_color_hex(0x07131c); }
static lv_color_t col_text() { return lv_color_hex(0xffffff); }
static lv_color_t col_muted() { return lv_color_hex(0x8a97a3); }
static lv_color_t col_teal() { return lv_color_hex(0x2dd4bf); }
static lv_color_t col_amber() { return lv_color_hex(0xfbbf24); }
static lv_color_t col_rose() { return lv_color_hex(0xfb7185); }
static lv_color_t col_card() { return lv_color_hex(0x0d1f2b); }

static bool glance_bad() { return !have_glance || !glance_is_live(&last); }

static void style_screen(lv_obj_t *scr) {
  lv_obj_set_style_bg_color(scr, col_bg(), 0);
  lv_obj_set_style_bg_opa(scr, LV_OPA_COVER, 0);
  lv_obj_clear_flag(scr, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_add_flag(scr, LV_OBJ_FLAG_CLICKABLE);
  lv_obj_clear_flag(scr, LV_OBJ_FLAG_GESTURE_BUBBLE);
}

static void on_home_event(lv_event_t *e) {
  const lv_event_code_t code = lv_event_get_code(e);
  if (code == LV_EVENT_GESTURE) {
    lv_dir_t dir = lv_indev_get_gesture_dir(lv_indev_get_act());
    if (dir == LV_DIR_LEFT) ui_show_feed();
  } else if (code == LV_EVENT_CLICKED) {
    ui_show_feed();
  }
}

static void on_feed_event(lv_event_t *e) {
  const lv_event_code_t code = lv_event_get_code(e);
  if (code == LV_EVENT_GESTURE) {
    lv_dir_t dir = lv_indev_get_gesture_dir(lv_indev_get_act());
    if (dir == LV_DIR_RIGHT) ui_show_home();
  } else if (code == LV_EVENT_CLICKED) {
    ui_show_home();
  }
}

static lv_obj_t *make_label(lv_obj_t *parent, const lv_font_t *font, lv_color_t color, lv_coord_t x,
                           lv_coord_t y, lv_coord_t w) {
  lv_obj_t *l = lv_label_create(parent);
  lv_obj_set_style_text_font(l, font, 0);
  lv_obj_set_style_text_color(l, color, 0);
  lv_obj_set_pos(l, x, y);
  if (w > 0) {
    lv_obj_set_width(l, w);
    lv_label_set_long_mode(l, LV_LABEL_LONG_CLIP);
  }
  lv_label_set_text(l, "");
  return l;
}

static void build_pairing() {
  if (scr_pair) return;
  scr_pair = lv_obj_create(nullptr);
  style_screen(scr_pair);

  lv_obj_t *kicker = make_label(scr_pair, &lv_font_montserrat_12, col_teal(), 0, 72, PANEL_HRES);
  lv_obj_set_style_text_align(kicker, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_text(kicker, "PAIRING");

  pair_code = make_label(scr_pair, &lv_font_montserrat_48, col_text(), 0, 120, PANEL_HRES);
  lv_obj_set_style_text_align(pair_code, LV_TEXT_ALIGN_CENTER, 0);

  pair_ssid = make_label(scr_pair, &lv_font_montserrat_16, col_muted(), 24, 200, PANEL_HRES - 48);
  lv_obj_set_style_text_align(pair_ssid, LV_TEXT_ALIGN_CENTER, 0);

  pair_status = make_label(scr_pair, &lv_font_montserrat_16, col_muted(), 40, 280, PANEL_HRES - 80);
  lv_obj_set_style_text_align(pair_status, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_text(pair_status, "waiting for Hub");

  lv_obj_t *hint = make_label(scr_pair, &lv_font_montserrat_12, col_muted(), 40, 330, PANEL_HRES - 80);
  lv_obj_set_style_text_align(hint, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_text(hint, "Join this Wi-Fi. POST /wifi.\nLeave this code up.");

  pair_ver = make_label(scr_pair, &lv_font_montserrat_12, col_muted(), 0, 430, PANEL_HRES);
  lv_obj_set_style_text_align(pair_ver, LV_TEXT_ALIGN_CENTER, 0);
}

static void build_home() {
  if (scr_home) return;
  scr_home = lv_obj_create(nullptr);
  style_screen(scr_home);
  lv_obj_add_event_cb(scr_home, on_home_event, LV_EVENT_ALL, nullptr);

  home_tank = make_label(scr_home, &lv_font_montserrat_16, col_muted(), 28, 24, 280);
  home_live = make_label(scr_home, &lv_font_montserrat_16, col_amber(), 320, 24, 140);
  lv_obj_set_style_text_align(home_live, LV_TEXT_ALIGN_RIGHT, 0);

  home_banner = lv_obj_create(scr_home);
  lv_obj_set_size(home_banner, 424, 56);
  lv_obj_set_pos(home_banner, 28, 64);
  lv_obj_set_style_bg_color(home_banner, col_card(), 0);
  lv_obj_set_style_bg_opa(home_banner, LV_OPA_COVER, 0);
  lv_obj_set_style_border_width(home_banner, 0, 0);
  lv_obj_set_style_radius(home_banner, 12, 0);
  lv_obj_set_style_pad_all(home_banner, 12, 0);
  lv_obj_clear_flag(home_banner, LV_OBJ_FLAG_SCROLLABLE);
  lv_obj_t *banner_txt = lv_label_create(home_banner);
  lv_obj_set_style_text_font(banner_txt, &lv_font_montserrat_16, 0);
  lv_obj_set_style_text_color(banner_txt, col_muted(), 0);
  lv_label_set_text(banner_txt, "No feed");
  lv_obj_center(banner_txt);
  lv_obj_set_user_data(home_banner, banner_txt);

  for (int i = 0; i < 4; i++) {
    const int col = i % 2;
    const int row = i / 2;
    const int x = 28 + col * 220;
    const int y = 140 + row * 150;
    home_probe_name[i] = make_label(scr_home, &lv_font_montserrat_12, col_muted(), x, y, 200);
    home_probe_val[i] = make_label(scr_home, &lv_font_montserrat_28, col_text(), x, y + 28, 200);
    home_probe_unit[i] = make_label(scr_home, &lv_font_montserrat_12, col_muted(), x, y + 72, 200);
    lv_label_set_text(home_probe_name[i], i == 0 ? "Temp" : i == 1 ? "pH" : i == 2 ? "Salinity" : "Alk");
    lv_label_set_text(home_probe_val[i], "—");
  }

  lv_obj_t *swipe = make_label(scr_home, &lv_font_montserrat_12, col_muted(), 0, 444, PANEL_HRES);
  lv_obj_set_style_text_align(swipe, LV_TEXT_ALIGN_CENTER, 0);
  lv_label_set_text(swipe, "swipe / tap  ·  hold to pair");
}

static void build_feed() {
  if (scr_feed) return;
  scr_feed = lv_obj_create(nullptr);
  style_screen(scr_feed);
  lv_obj_add_event_cb(scr_feed, on_feed_event, LV_EVENT_ALL, nullptr);

  lv_obj_t *title = make_label(scr_feed, &lv_font_montserrat_16, col_muted(), 28, 24, 200);
  lv_label_set_text(title, "FEED");

  for (int i = 0; i < 4; i++) {
    const int col = i % 2;
    const int row = i / 2;
    feed_card[i] = lv_obj_create(scr_feed);
    lv_obj_set_size(feed_card[i], 200, 150);
    lv_obj_set_pos(feed_card[i], 28 + col * 220, 80 + row * 170);
    lv_obj_set_style_bg_color(feed_card[i], col_card(), 0);
    lv_obj_set_style_bg_opa(feed_card[i], LV_OPA_COVER, 0);
    lv_obj_set_style_border_width(feed_card[i], 2, 0);
    lv_obj_set_style_border_color(feed_card[i], col_muted(), 0);
    lv_obj_set_style_radius(feed_card[i], 16, 0);
    lv_obj_clear_flag(feed_card[i], LV_OBJ_FLAG_SCROLLABLE);

    feed_letter[i] = lv_label_create(feed_card[i]);
    lv_obj_set_style_text_font(feed_letter[i], &lv_font_montserrat_48, 0);
    lv_obj_set_style_text_color(feed_letter[i], col_text(), 0);
    lv_label_set_text(feed_letter[i], kFeedLetters[i]);
    lv_obj_align(feed_letter[i], LV_ALIGN_TOP_MID, 0, 12);

    feed_label[i] = lv_label_create(feed_card[i]);
    lv_obj_set_style_text_font(feed_label[i], &lv_font_montserrat_12, 0);
    lv_obj_set_style_text_color(feed_label[i], col_muted(), 0);
    lv_label_set_text(feed_label[i], kFeedNames[i]);
    lv_obj_align(feed_label[i], LV_ALIGN_BOTTOM_MID, 0, -12);
  }

  feed_remain = make_label(scr_feed, &lv_font_montserrat_20, col_muted(), 0, 420, PANEL_HRES);
  lv_obj_set_style_text_align(feed_remain, LV_TEXT_ALIGN_CENTER, 0);
}

static void paint_home() {
  if (!home_tank) return;
  lv_label_set_text(home_tank, last.tankName[0] ? last.tankName : "Reef");
  const bool bad = glance_bad();
  lv_label_set_text(home_live, bad ? "Stale" : "Live");
  lv_obj_set_style_text_color(home_live, bad ? col_amber() : col_teal(), 0);

  lv_obj_t *banner_txt = (lv_obj_t *)lv_obj_get_user_data(home_banner);
  if (last.feedActive[0]) {
    char buf[48];
    snprintf(buf, sizeof(buf), "FEED %s  %d:%02d", last.feedActive, last.remainingSec / 60,
             last.remainingSec % 60);
    lv_label_set_text(banner_txt, buf);
    lv_obj_set_style_text_color(banner_txt, bad ? col_rose() : col_text(), 0);
    lv_obj_set_style_bg_color(home_banner, bad ? lv_color_hex(0x3a1a1a) : lv_color_hex(0x12352f), 0);
  } else {
    lv_label_set_text(banner_txt, "No feed");
    lv_obj_set_style_text_color(banner_txt, col_muted(), 0);
    lv_obj_set_style_bg_color(home_banner, col_card(), 0);
  }

  for (int i = 0; i < 4; i++) {
    if (i < last.probeCount) {
      lv_label_set_text(home_probe_name[i], last.probes[i].name);
      lv_label_set_text(home_probe_val[i], last.probes[i].display);
      lv_label_set_text(home_probe_unit[i], last.probes[i].unit);
      lv_color_t c = col_text();
      if (bad) {
        c = col_muted();
      } else if (strcmp(last.probes[i].band, "alarm") == 0) {
        c = col_rose();
      } else if (strcmp(last.probes[i].band, "warn") == 0) {
        c = col_amber();
      } else if (strcmp(last.probes[i].band, "ok") == 0) {
        c = col_teal();
      }
      lv_obj_set_style_text_color(home_probe_val[i], c, 0);
    } else {
      lv_label_set_text(home_probe_val[i], "—");
      lv_obj_set_style_text_color(home_probe_val[i], col_muted(), 0);
    }
  }
}

static void paint_feed() {
  if (!feed_remain) return;
  const bool bad = glance_bad();
  int active_i = -1;
  if (last.feedActive[0] == 'A') active_i = 0;
  else if (last.feedActive[0] == 'B') active_i = 1;
  else if (last.feedActive[0] == 'C') active_i = 2;
  else if (last.feedActive[0] == 'D') active_i = 3;
  for (int i = 0; i < 4; i++) {
    const bool on = (i == active_i);
    lv_obj_set_style_border_color(feed_card[i], on ? (bad ? col_amber() : col_teal()) : col_muted(), 0);
    lv_obj_set_style_bg_color(feed_card[i], on ? (bad ? lv_color_hex(0x3a1a1a) : lv_color_hex(0x12352f)) : col_card(),
                              0);
    lv_obj_set_style_text_color(feed_letter[i], on && !bad ? col_teal() : col_text(), 0);
  }
  if (active_i >= 0) {
    char buf[48];
    snprintf(buf, sizeof(buf), "%s  %d:%02d", last.feedActive, last.remainingSec / 60, last.remainingSec % 60);
    lv_label_set_text(feed_remain, buf);
    lv_obj_set_style_text_color(feed_remain, bad ? col_amber() : col_teal(), 0);
  } else {
    lv_label_set_text(feed_remain, "Idle");
    lv_obj_set_style_text_color(feed_remain, col_muted(), 0);
  }
}

static void ensure_glass() {
  if (!display_ready()) return;
  build_pairing();
  build_home();
  build_feed();
}
#endif

void ui_begin() {
  statusLine[0] = 0;
  pairing = true;
  page = PAGE_PAIR;
  glance_clear(&last);
#ifdef REEFDECK_HAS_DISPLAY
  ensure_glass();
#endif
}

void ui_show_pairing() {
  pairing = true;
  page = PAGE_PAIR;
  Serial.printf("PAIRING  code %s  join %s  %s\n", panel_pairing_code(), panel_ap_ssid(), REEFDECK_VERSION);
#ifdef REEFDECK_HAS_DISPLAY
  ensure_glass();
  if (display_ready() && pair_code) {
    lv_label_set_text(pair_code, panel_pairing_code());
    lv_label_set_text(pair_ssid, panel_ap_ssid());
    lv_label_set_text(pair_status, statusLine[0] ? statusLine : "waiting for Hub");
    lv_label_set_text_fmt(pair_ver, "Sightglass %s", REEFDECK_VERSION);
    lv_scr_load(scr_pair);
  }
#endif
}

void ui_show_home() {
  pairing = false;
  page = PAGE_HOME;
#ifdef REEFDECK_HAS_DISPLAY
  ensure_glass();
  paint_home();
  if (display_ready() && scr_home) lv_scr_load(scr_home);
#endif
}

void ui_show_feed() {
  pairing = false;
  page = PAGE_FEED;
#ifdef REEFDECK_HAS_DISPLAY
  ensure_glass();
  paint_feed();
  if (display_ready() && scr_feed) lv_scr_load(scr_feed);
#endif
}

void ui_apply_glance(const GlanceState *g) {
  if (!g) return;
  last = *g;
  have_glance = true;
  if (page == PAGE_HOME) {
#ifdef REEFDECK_HAS_DISPLAY
    paint_home();
#endif
  } else if (page == PAGE_FEED) {
#ifdef REEFDECK_HAS_DISPLAY
    paint_feed();
#endif
  }
}

void ui_on_long_press() {
  if (page == PAGE_PAIR) return;
  Serial.println("Hold-to-pair: clearing NVS, reboot to SoftAP");
  config_clear();
  delay(200);
  ESP.restart();
}

void ui_set_status_line(const char *msg) {
  glance_copy_str(statusLine, sizeof(statusLine), msg);
#ifdef REEFDECK_HAS_DISPLAY
  if (pair_status && msg) lv_label_set_text(pair_status, msg);
#endif
}

bool ui_is_pairing() { return pairing || net_is_pairing(); }

void ui_loop() {
  if (!pairing) return;
  unsigned long now = millis();
  if (now - lastPairBanner < 5000) return;
  lastPairBanner = now;
  Serial.printf("PAIRING  code %s  AP %s  http://192.168.4.1  %s\n", panel_pairing_code(), panel_ap_ssid(),
                REEFDECK_VERSION);
}
