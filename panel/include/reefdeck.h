#pragma once

#include <stdint.h>

// JSON contract the panel understands. Same payload as GET /api/status
// from Helm. If Helm is down, firmware may poll Apex
// /rest/status when APEX_HOST is set so the glass still shows numbers —
// always as Stale/disconnected colors if the poll fails.

#define REEFDECK_VERSION "0.1.1-alpha"
#define REEFDECK_FW_VERSION REEFDECK_VERSION
#define REEFDECK_STATUS_PATH "/api/status"
#define REEFDECK_APEX_STATUS_PATH "/rest/status"
#define REEFDECK_POLL_MS 2000
#define REEFDECK_HOLD_PAIR_MS 3000
#define REEFDECK_BOOT_BTN 0

#ifndef HUB_BASE_DEFAULT
#define HUB_BASE_DEFAULT "http://192.168.1.10:43180"
#endif
#define REEFDECK_DEFAULT_HUB HUB_BASE_DEFAULT

#ifndef APEX_HOST_DEFAULT
#define APEX_HOST_DEFAULT ""
#endif

struct GlanceProbe {
  char name[20];
  char kind[12];
  char display[12];
  char unit[8];
  char band[8];
};

struct GlanceState {
  char tankName[48];
  bool connected;
  bool stale;
  char feedActive[4];
  int remainingSec;
  char feedLabel[24];
  GlanceProbe probes[4];
  uint8_t probeCount;
  char source[8];
  char reason[24];
};

void glance_copy_str(char *dst, unsigned n, const char *src);
void glance_clear(GlanceState *g);
bool glance_is_live(const GlanceState *g);
void glance_log_serial(const GlanceState *g);
