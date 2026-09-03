#include "reefdeck.h"
#include <Arduino.h>
#include <string.h>

void glance_copy_str(char *dst, unsigned n, const char *src) {
  if (!dst || n == 0) return;
  if (!src) src = "";
  strncpy(dst, src, n - 1);
  dst[n - 1] = 0;
}

void glance_clear(GlanceState *g) {
  if (!g) return;
  memset(g, 0, sizeof(*g));
  glance_copy_str(g->tankName, sizeof(g->tankName), "Reef");
  g->connected = false;
  g->stale = true;
  g->remainingSec = 0;
  g->probeCount = 0;
  glance_copy_str(g->source, sizeof(g->source), "hub");
  glance_copy_str(g->reason, sizeof(g->reason), "offline");
}

bool glance_is_live(const GlanceState *g) { return g && g->connected && !g->stale; }

void glance_log_serial(const GlanceState *g) {
  if (!g) return;

  // Livestock rule: never present last-good numbers as healthy.
  if (!glance_is_live(g)) {
    Serial.printf("STALE/OFFLINE  tank=%s source=%s reason=%s\n", g->tankName, g->source, g->reason);
    if (g->probeCount == 0) {
      Serial.println("  (no live probes — last-good values hidden)");
      return;
    }
    Serial.println("  (this poll is stale — values not healthy)");
    for (uint8_t i = 0; i < g->probeCount; i++) {
      const GlanceProbe *p = &g->probes[i];
      Serial.printf("  STALE  %s %s %s [%s]\n", p->name, p->display, p->unit, p->band);
    }
    return;
  }

  Serial.printf("LIVE  %s  feed=%s remain=%d\n", g->tankName, g->feedActive, g->remainingSec);
  for (uint8_t i = 0; i < g->probeCount; i++) {
    const GlanceProbe *p = &g->probes[i];
    Serial.printf("  %s %s %s [%s]\n", p->name, p->display, p->unit, p->band);
  }
}
