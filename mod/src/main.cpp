#include <RED4ext/RED4ext.hpp>

#include "app_interface.h"
#include "updater.h"

using namespace NightCityNav;

RED4EXT_C_EXPORT bool RED4EXT_CALL Main(RED4ext::v1::PluginHandle aHandle,
                                        RED4ext::v1::EMainReason aReason,
                                        const RED4ext::v1::Sdk *aSdk) {
    switch (aReason) {
        case RED4ext::v1::EMainReason::Load: {
            app = std::make_unique<AppInterface>(aHandle, aSdk);

            RED4ext::v1::GameState running_state;
            running_state.OnEnter = running_enter;
            running_state.OnUpdate = running_update;
            running_state.OnExit = running_exit;

            aSdk->gameStates->Add(aHandle, RED4ext::EGameStateType::Running, &running_state);

            app->log_info("Initialized GPS Server");

            break;
        }
        case RED4ext::v1::EMainReason::Unload:
            break;
    }

    return true;
}

RED4EXT_C_EXPORT void RED4EXT_CALL Query(RED4ext::v1::PluginInfo *aInfo) {
    aInfo->name = L"Night City Navigator";
    aInfo->author = L"ceepu";
    aInfo->version = RED4EXT_V1_SEMVER(0, 7, 0);
    aInfo->runtime = RED4EXT_V1_RUNTIME_VERSION_INDEPENDENT;
    aInfo->sdk = RED4EXT_V1_SDK_VERSION_CURRENT;
}

RED4EXT_C_EXPORT uint32_t RED4EXT_CALL Supports() { return RED4EXT_API_VERSION_1; }
