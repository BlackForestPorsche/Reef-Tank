#include "poller.h"
#include "config.h"
#include "net.h"
#include "reefdeck.h"
#include "ui.h"
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ctype.h>
#include <stdio.h>
#include <string.h>

static GlanceState glance;
static unsigned long lastPoll = 0;

static const char *kind_from(const char *name, const char *type) {
  char hay[48];
  snprintf(hay, sizeof(hay), "%s %s", name ? name : "", type ? type : "");
  for (char *p = hay; *p; p++) *p = (char)tolower(*p);
  if (strstr(hay, "temp") || strstr(hay, "tmp")) return "temp";
  if (strstr(hay, "ph")) return "ph";
  if (strstr(hay, "cond") || strstr(hay, "sal") || strstr(hay, "ppt")) return "salinity";
  if (strstr(hay, "alk") || strstr(hay, "kh")) return "alk";
  return "other";
}

static void pick_probes(JsonArray probes, bool from_apex) {
  glance.probeCount = 0;
  const char *order[] = {"temp", "ph", "salinity", "alk"};
  for (uint8_t k = 0; k < 4; k++) {
    if (probes.isNull()) break;
    for (JsonObject p : probes) {
      const char *name = p["name"] | "";
      const char *type = p["type"] | "";
      const char *kind = from_apex ? kind_from(name, type) : (p["kind"] | kind_from(name, type));
      if (strcmp(kind, order[k]) != 0) continue;
      GlanceProbe *out = &glance.probes[glance.probeCount];
      glance_copy_str(out->name, sizeof(out->name), name);
      glance_copy_str(out->kind, sizeof(out->kind), kind);
      if (from_apex) {
        glance_copy_str(out->display, sizeof(out->display), p["value"] | "—");
        if (strcmp(kind, "temp") == 0) glance_copy_str(out->unit, sizeof(out->unit), "°F");
        else if (strcmp(kind, "salinity") == 0) glance_copy_str(out->unit, sizeof(out->unit), "ppt");
        else if (strcmp(kind, "alk") == 0) glance_copy_str(out->unit, sizeof(out->unit), "dKH");
        else out->unit[0] = 0;
        glance_copy_str(out->band, sizeof(out->band), "ok");
      } else {
        glance_copy_str(out->display, sizeof(out->display), p["display"] | "");
        glance_copy_str(out->unit, sizeof(out->unit), p["unit"] | "");
        glance_copy_str(out->band, sizeof(out->band), p["band"] | "");
      }
      glance.probeCount++;
      break;
    }
  }
}

static void mark_offline(const char *reason) {
  glance_clear(&glance);
  glance_copy_str(glance.reason, sizeof(glance.reason), reason);
  ui_apply_glance(&glance);
}

static bool http_get_json(const String &url, const String &user, const String &pass, JsonDocument &doc) {
  HTTPClient http;
  http.setTimeout(4000);
  http.addHeader("Accept", "application/json");
  if (user.length()) http.setAuthorization(user.c_str(), pass.c_str());
  if (!http.begin(url)) return false;
  const int code = http.GET();
  if (code != 200) {
    Serial.printf("http %d %s\n", code, url.c_str());
    http.end();
    return false;
  }
  DeserializationError err = deserializeJson(doc, http.getStream());
  http.end();
  if (err) {
    Serial.printf("stale: json %s\n", err.c_str());
    return false;
  }
  return true;
}

static bool poll_hub() {
  String base = config_hub_base();
  if (base.length() == 0) return false;
  if (base.endsWith("/")) base.remove(base.length() - 1);

  JsonDocument doc;
  if (!http_get_json(base + REEFDECK_STATUS_PATH, "", "", doc)) return false;

  glance_copy_str(glance.tankName, sizeof(glance.tankName), doc["tankName"] | "Reef");
  glance.connected = doc["connected"] | false;
  glance.stale = doc["stale"] | true;
  glance_copy_str(glance.source, sizeof(glance.source), "hub");
  const char *feed = doc["feed"]["active"] | "";
  glance_copy_str(glance.feedActive, sizeof(glance.feedActive), feed);
  glance.remainingSec = doc["feed"]["remainingSec"] | 0;
  glance_copy_str(glance.feedLabel, sizeof(glance.feedLabel), doc["feed"]["label"] | "");
  pick_probes(doc["probes"].as<JsonArray>(), false);
  glance_copy_str(glance.reason, sizeof(glance.reason), glance_is_live(&glance) ? "" : "hub stale");
  ui_apply_glance(&glance);
  return glance_is_live(&glance);
}

static bool poll_apex() {
  String host = config_apex_host();
  host.trim();
  if (host.length() == 0) return false;

  String url = host;
  if (!url.startsWith("http://") && !url.startsWith("https://")) url = String("http://") + host;
  if (url.endsWith("/")) url.remove(url.length() - 1);
  url += REEFDECK_APEX_STATUS_PATH;

  JsonDocument doc;
  if (!http_get_json(url, config_apex_user(), config_apex_pass(), doc)) return false;

  glance_copy_str(glance.tankName, sizeof(glance.tankName), doc["system"]["hostname"] | "Apex");
  glance.connected = true;
  glance.stale = false;
  glance_copy_str(glance.source, sizeof(glance.source), "apex");
  const char *feed = doc["feed"]["name"] | "";
  char ch[2] = {0, 0};
  if (feed[0] == 'A' || feed[0] == 'B' || feed[0] == 'C' || feed[0] == 'D') {
    ch[0] = (char)toupper(feed[0]);
  } else {
    int active = doc["feed"]["active"] | 0;
    if (active >= 1 && active <= 4) ch[0] = (char)('A' + active - 1);
  }
  glance_copy_str(glance.feedActive, sizeof(glance.feedActive), ch);
  glance.remainingSec = doc["feed"]["time"] | 0;
  if (glance.remainingSec <= 0) glance.feedActive[0] = 0;
  glance_copy_str(glance.feedLabel, sizeof(glance.feedLabel), glance.feedActive[0] ? "Feed" : "Idle");
  pick_probes(doc["inputs"].as<JsonArray>(), true);
  glance_copy_str(glance.reason, sizeof(glance.reason), "");
  ui_apply_glance(&glance);
  return true;
}

void poller_begin() {
  glance_clear(&glance);
  lastPoll = 0;
}

void poller_loop() {
  if (net_is_pairing()) return;

  unsigned long now = millis();
  if (now - lastPoll < REEFDECK_POLL_MS) return;
  lastPoll = now;

  if (!net_sta_up()) {
    mark_offline("wifi");
    glance_log_serial(&glance);
    return;
  }

  if (!poll_hub()) {
    Serial.println("STALE/OFFLINE  hub failed — trying Apex /rest/status");
    if (!poll_apex()) mark_offline("hub");
  }

  glance_log_serial(&glance);
}

const GlanceState *poller_glance() { return &glance; }
