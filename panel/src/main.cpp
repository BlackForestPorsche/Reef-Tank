#include <Arduino.h>
#include "button.h"
#include "config.h"
#include "display.h"
#include "net.h"
#include "ota.h"
#include "poller.h"
#include "reefdeck.h"
#include "ui.h"

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.printf("Sightglass %s\n", REEFDECK_VERSION);
  Serial.println("SKU Guition/Sunton ESP32-S3-4848S040  480x480 ST7701 + GT911");

  config_begin();
  button_begin();
  Serial.printf("identity MAC-suffix %s  AP %s  pairing %s\n", panel_mac_suffix(), panel_ap_ssid(),
                panel_pairing_code());

  bool glass = display_begin();
  ui_begin();
  net_begin();
  poller_begin();
  ota_begin();

  if (net_is_pairing()) {
    ui_show_pairing();
  } else {
    ui_show_home();
  }

  if (!glass) {
    Serial.println("Glass off this build. Dummy UI remains at the Hub /panel page.");
  }
}

void loop() {
  button_loop();
  display_loop();
  net_loop();
  poller_loop();
  ota_loop();
  ui_loop();
  delay(5);
}
