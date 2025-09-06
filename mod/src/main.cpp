#include <RED4ext/RED4ext.hpp>

#include "app_interface.h"
#include "updater.h"

using namespace NightCityNav;

RED4EXT_C_EXPORT bool RED4EXT_CALL Main(RED4ext::PluginHandle aHandle, RED4ext::EMainReason aReason,
                                        const RED4ext::Sdk *aSdk) {
    switch (aReason) {
        case RED4ext::EMainReason::Load: {
            app = std::make_unique<AppInterface>(aHandle, aSdk);

            RED4ext::GameState running_state;
            running_state.OnEnter = running_enter;
            running_state.OnUpdate = running_update;
            running_state.OnExit = running_exit;

            aSdk->gameStates->Add(aHandle, RED4ext::EGameStateType::Running, &running_state);

            app->log_info("Initialized GPS Server");

            break;
        }
        case RED4ext::EMainReason::Unload:
            break;
    }

    return true;
}

RED4EXT_C_EXPORT void RED4EXT_CALL Query(RED4ext::PluginInfo *aInfo) {
    aInfo->name = L"Night City Navigator";
    aInfo->author = L"ceepu";
    aInfo->version = RED4EXT_SEMVER(0, 5, 0);
    aInfo->runtime = RED4EXT_RUNTIME_LATEST;
    aInfo->sdk = RED4EXT_SDK_LATEST;
}

RED4EXT_C_EXPORT uint32_t RED4EXT_CALL Supports() { return RED4EXT_API_VERSION_LATEST; }
