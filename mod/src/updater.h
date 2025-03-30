#pragma once

#include <RED4ext/RED4ext.hpp>

namespace NightCityNav {

    // void set_app_info(const RED4ext::Sdk *sdk, RED4ext::PluginHandle handle);

    bool running_enter(RED4ext::CGameApplication *aApp);
    bool running_update(RED4ext::CGameApplication *aApp);
    bool running_exit(RED4ext::CGameApplication *aApp);
}
