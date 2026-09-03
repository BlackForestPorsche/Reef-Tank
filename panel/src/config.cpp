#include "config.h"
#include "reefdeck.h"
#include <Preferences.h>
#include <WiFi.h>
#include <stdio.h>
#include <string.h>

static Preferences prefs;
static char apSsid[24];
static char pairingCode[8];
static char macSuffix[8];

void identity_begin() {
  uint8_t mac[6] = {0};
  WiFi.macAddress(mac);
  snprintf(macSuffix, sizeof(macSuffix), "%02X%02X", mac[4], mac[5]);
  snprintf(apSsid, sizeof(apSsid), "Sightglass-%s", macSuffix);
  uint16_t code = (uint16_t)(((uint16_t)mac[4] << 8) | mac[5]) % 10000;
  snprintf(pairingCode, sizeof(pairingCode), "%04u", code);
}

const char *panel_ap_ssid() { return apSsid; }
const char *panel_pairing_code() { return pairingCode; }
const char *panel_mac_suffix() { return macSuffix; }

void config_begin() {
  prefs.begin("rdpanel", false);
  identity_begin();
}

void config_clear() {
  prefs.clear();
  Serial.println("NVS rdpanel cleared");
}

bool config_has_wifi() { return config_wifi_ssid().length() > 0; }

String config_wifi_ssid() { return prefs.getString("ssid", ""); }
String config_wifi_pass() { return prefs.getString("pass", ""); }

String config_hub_base() {
  String v = prefs.getString("hub", "");
  if (v.length() == 0) return String(HUB_BASE_DEFAULT);
  return v;
}

String config_apex_host() {
  String v = prefs.getString("apex", "");
  if (v.length() == 0) return String(APEX_HOST_DEFAULT);
  return v;
}

String config_apex_user() { return prefs.getString("auser", ""); }
String config_apex_pass() { return prefs.getString("apass", ""); }

void config_save_wifi(const String &ssid, const String &pass) {
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
}

void config_save_hub(const String &hub) {
  if (hub.length()) prefs.putString("hub", hub);
}

void config_save_apex(const String &host, const String &user, const String &pass) {
  if (host.length()) prefs.putString("apex", host);
  if (user.length()) prefs.putString("auser", user);
  if (pass.length()) prefs.putString("apass", pass);
}
