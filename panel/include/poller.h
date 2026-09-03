#pragma once

#include "reefdeck.h"

void poller_begin();
void poller_loop();
const GlanceState *poller_glance();
