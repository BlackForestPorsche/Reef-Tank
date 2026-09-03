#include "button.h"
#include "config.h"
#include "reefdeck.h"
#include <Arduino.h>

static unsigned long heldFrom = 0;

void button_begin() {
  pinMode(REEFDECK_BOOT_BTN, INPUT_PULLUP);
}

void button_loop() {
  // GPIO0 is BOOT on the S3 and also TFT_R4 on 4848S040. Holding the boot
  // button 3s clears NVS and reboots into SoftAP. On a live RGB panel this
  // may glitch the red channel while the pin is held — that is intentional.
  if (digitalRead(REEFDECK_BOOT_BTN) == LOW) {
    if (heldFrom == 0) heldFrom = millis();
    else if (millis() - heldFrom >= REEFDECK_HOLD_PAIR_MS) {
      Serial.println("Hold-to-pair: clearing NVS, reboot to SoftAP");
      config_clear();
      delay(200);
      ESP.restart();
    }
  } else {
    heldFrom = 0;
  }
}
