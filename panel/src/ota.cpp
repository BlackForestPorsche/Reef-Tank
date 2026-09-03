#include "ota.h"
#include "config.h"
#include "reefdeck.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <HTTPUpdate.h>
#include <WiFi.h>

#ifndef REEFDECK_OTA_MS
#define REEFDECK_OTA_MS 30000
#endif

static unsigned long lastCheck = 0;
static bool updating = false;

static String hubOrigin() {
  String base = config_hub_base();
  if (base.endsWith("/")) base.remove(base.length() - 1);
  return base;
}

static void reportHello() {
  String url = hubOrigin() + "/api/ota";
  HTTPClient http;
  http.setTimeout(4000);
  if (!http.begin(url)) return;
  http.addHeader("Content-Type", "application/json");
  String body = String("{\"action\":\"hello\",\"kind\":\"panel\",\"id\":\"") +
                panel_mac_suffix() + "\",\"version\":\"" + REEFDECK_VERSION + "\"}";
  http.POST(body);
  http.end();
}

void ota_begin() {
  lastCheck = 0;
  httpUpdate.rebootOnUpdate(true);
}

void ota_loop() {
  if (WiFi.status() != WL_CONNECTED || updating) return;
  unsigned long now = millis();
  if (lastCheck != 0 && now - lastCheck < REEFDECK_OTA_MS) return;
  lastCheck = now;

  String url = hubOrigin() + "/api/ota/manifest?kind=panel&id=" + panel_mac_suffix() +
               "&version=" + REEFDECK_VERSION;
  HTTPClient http;
  http.setTimeout(4000);
  if (!http.begin(url)) return;
  int code = http.GET();
  if (code != 200) {
    http.end();
    return;
  }
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, http.getStream());
  http.end();
  if (err) return;

  const char *target = doc["version"] | REEFDECK_VERSION;
  bool pending = doc["pending"] | false;
  bool hasBin = doc["binaryPresent"] | false;
  const char *binUrl = doc["url"] | "";

  if (!pending || !hasBin || strcmp(target, REEFDECK_VERSION) == 0) {
    reportHello();
    return;
  }

  Serial.printf("OTA: pushing %s from %s\n", target, binUrl);
  updating = true;
  WiFiClient client;
  t_httpUpdate_return ret = httpUpdate.update(client, String(binUrl));
  switch (ret) {
    case HTTP_UPDATE_FAILED:
      Serial.printf("OTA fail %s\n", httpUpdate.getLastErrorString().c_str());
      updating = false;
      break;
    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("OTA: no update");
      updating = false;
      break;
    case HTTP_UPDATE_OK:
      Serial.println("OTA ok — reboot");
      break;
  }
}
