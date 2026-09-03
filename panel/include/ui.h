#pragma once

#include "reefdeck.h"

void ui_begin();
void ui_loop();
void ui_show_pairing();
void ui_show_home();
void ui_show_feed();
void ui_apply_glance(const GlanceState *g);
bool ui_is_pairing();
void ui_on_long_press();
void ui_set_status_line(const char *msg);
