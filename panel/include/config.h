#pragma once

#include <Arduino.h>

void config_begin();
void config_clear();
bool config_has_wifi();
String config_wifi_ssid();
String config_wifi_pass();
String config_hub_base();
String config_apex_host();
String config_apex_user();
String config_apex_pass();

void config_save_wifi(const String &ssid, const String &pass);
void config_save_hub(const String &hub);
void config_save_apex(const String &host, const String &user, const String &pass);

void identity_begin();
const char *panel_ap_ssid();
const char *panel_pairing_code();
const char *panel_mac_suffix();
