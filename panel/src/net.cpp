#include "net.h"
#include "config.h"
#include "reefdeck.h"
#include "ui.h"
#include <ArduinoJson.h>
#include <DNSServer.h>
#include <WebServer.h>
#include <WiFi.h>

enum NetMode { NET_AP, NET_STA };

static NetMode mode = NET_AP;
static DNSServer dns;
static WebServer server(80);
static bool staUp = false;
static bool serverUp = false;
static unsigned long lastStaAttempt = 0;
static bool loggedStaIp = false;

static const byte DNS_PORT = 53;
static IPAddress apIP(192, 168, 4, 1);

static String portalHtml() {
  String html;
  html.reserve(1600);
  html += F(
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\">"
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
      "<title>Sightglass</title><style>"
      "body{font-family:system-ui,sans-serif;background:#07131c;color:#fff;"
      "margin:0;padding:24px;max-width:420px}"
      "h1{font-size:18px;letter-spacing:.12em;text-transform:uppercase;color:#5eead4}"
      ".pair{font-size:48px;letter-spacing:.18em;text-align:center;margin:18px 0;font-family:ui-monospace,monospace}"
      "label{display:block;font-size:12px;color:#94a3b8;margin-top:10px}"
      "input{width:100%;box-sizing:border-box;padding:10px;margin:6px 0 4px;"
      "border-radius:8px;border:0;background:#0f2740;color:#fff}"
      "button{width:100%;margin-top:18px;padding:12px;border:0;border-radius:8px;"
      "background:#14b8a6;color:#042f2e;font-weight:700}"
      "p{color:#94a3b8;font-size:13px;line-height:1.4}"
      "</style></head><body><h1>Sightglass</h1><div class=\"pair\">");
  html += panel_pairing_code();
  html += F("</div><p>SSID <b>");
  html += panel_ap_ssid();
  html += F("</b>. waiting for Hub. POST /wifi {ssid, password}.</p>"
            "<form method=\"POST\" action=\"/wifi\">"
            "<label>Wi-Fi SSID</label><input name=\"ssid\" required autocomplete=\"off\">"
            "<label>Password</label><input name=\"password\" type=\"password\">"
            "<label>Hub URL</label><input name=\"hub\" value=\"");
  html += HUB_BASE_DEFAULT;
  html += F("\">"
            "<label>Apex host (optional)</label>"
            "<input name=\"apexHost\" placeholder=\"192.168.1.50\" autocomplete=\"off\">"
            "<button type=\"submit\">Join Wi-Fi</button></form>"
            "<p>v");
  html += REEFDECK_VERSION;
  html += F("</p></body></html>");
  return html;
}

static void cors() { server.sendHeader("Access-Control-Allow-Origin", "*"); }

static void handleRoot() {
  cors();
  server.send(200, "text/html", portalHtml());
}

static bool join_sta(const String &ssid, const String &pass) {
  Serial.printf("wifi: joining %s\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  const unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();
  staUp = WiFi.status() == WL_CONNECTED;
  if (staUp) {
    Serial.print("IP ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("wifi: join failed");
  }
  return staUp;
}

static void handleWifi() {
  cors();
  String ssid, pass, hub, apex, auser, apass;
  const String body = server.arg("plain");
  if (body.length() && body[0] == '{') {
    JsonDocument doc;
    if (deserializeJson(doc, body)) {
      server.send(400, "application/json", "{\"ok\":false,\"error\":\"json\"}");
      return;
    }
    ssid = String((const char *)(doc["ssid"] | ""));
    pass = String((const char *)(doc["password"] | ""));
    hub = String((const char *)(doc["hub"] | ""));
    apex = String((const char *)(doc["apexHost"] | ""));
    auser = String((const char *)(doc["apexUser"] | ""));
    apass = String((const char *)(doc["apexPassword"] | ""));
  } else {
    ssid = server.arg("ssid");
    pass = server.hasArg("password") ? server.arg("password") : server.arg("pass");
    hub = server.arg("hub");
    apex = server.hasArg("apexHost") ? server.arg("apexHost") : server.arg("apex");
  }
  ssid.trim();
  hub.trim();
  apex.trim();
  if (ssid.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"error\":\"ssid required\"}");
    return;
  }

  config_save_wifi(ssid, pass);
  config_save_hub(hub.length() ? hub : String(HUB_BASE_DEFAULT));
  if (apex.length() || auser.length() || apass.length()) config_save_apex(apex, auser, apass);

  if (join_sta(ssid, pass)) {
    if (serverUp) {
      dns.stop();
      WiFi.softAPdisconnect(true);
      server.stop();
      serverUp = false;
    }
    mode = NET_STA;
    lastStaAttempt = millis();
    loggedStaIp = true;
    server.send(200, "application/json", "{\"ok\":true}");
    ui_set_status_line("joined Wi-Fi");
    ui_show_home();
  } else {
    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
    WiFi.softAP(panel_ap_ssid());
    mode = NET_AP;
    server.send(502, "application/json", "{\"ok\":false,\"error\":\"join failed\"}");
    ui_set_status_line("Wi-Fi join failed");
    ui_show_pairing();
  }
}

static void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

static void startPortalServer() {
  if (serverUp) return;
  server.on("/", HTTP_GET, handleRoot);
  server.on("/wifi", HTTP_POST, handleWifi);
  server.on("/wifi", HTTP_OPTIONS, handleOptions);
  server.on("/save", HTTP_POST, handleWifi);
  server.on("/generate_204", HTTP_GET, handleRoot);
  server.on("/hotspot-detect.html", HTTP_GET, handleRoot);
  server.on("/canonical.html", HTTP_GET, handleRoot);
  server.on("/ncsi.txt", HTTP_GET, handleRoot);
  server.on("/connecttest.txt", HTTP_GET, handleRoot);
  server.on("/success.txt", HTTP_GET, handleRoot);
  server.onNotFound(handleRoot);
  server.begin();
  serverUp = true;
}

void net_enter_pairing_ap() {
  mode = NET_AP;
  staUp = false;
  loggedStaIp = false;
  WiFi.disconnect(true, false);
  delay(50);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(apIP, apIP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(panel_ap_ssid());
  dns.start(DNS_PORT, "*", apIP);
  startPortalServer();
  Serial.printf("SoftAP %s  http://192.168.4.1/wifi  pairing %s  %s\n", panel_ap_ssid(),
                panel_pairing_code(), REEFDECK_VERSION);
  ui_show_pairing();
}

void net_try_sta() {
  mode = NET_STA;
  staUp = false;
  loggedStaIp = false;
  if (serverUp) {
    server.stop();
    serverUp = false;
  }
  dns.stop();
  WiFi.mode(WIFI_STA);
  WiFi.begin(config_wifi_ssid().c_str(), config_wifi_pass().c_str());
  lastStaAttempt = millis();
  Serial.printf("STA joining %s  hub %s\n", config_wifi_ssid().c_str(), config_hub_base().c_str());
  ui_show_home();
}

void net_begin() {
  if (config_has_wifi()) {
    net_try_sta();
  } else {
    net_enter_pairing_ap();
  }
}

void net_loop() {
  if (mode == NET_AP) {
    dns.processNextRequest();
    if (serverUp) server.handleClient();
    return;
  }

  staUp = WiFi.status() == WL_CONNECTED;
  if (staUp) {
    if (!loggedStaIp) {
      loggedStaIp = true;
      Serial.print("STA IP ");
      Serial.println(WiFi.localIP());
    }
    return;
  }

  loggedStaIp = false;
  if (millis() - lastStaAttempt > 15000) {
    lastStaAttempt = millis();
    WiFi.disconnect();
    WiFi.begin(config_wifi_ssid().c_str(), config_wifi_pass().c_str());
    Serial.println("STALE/OFFLINE  wifi retry");
  }
}

bool net_sta_up() { return staUp; }
bool net_is_pairing() { return mode == NET_AP; }
