#include "app_interface.h"

#include <RED4ext/RED4ext.hpp>
#include <string_view>

namespace NightCityNav {
    std::unique_ptr<AppInterface> app;

    void AppInterface::log_trace(const std::string_view &msg) {
        sdk.logger->Trace(handle, msg.data());
    }
    void AppInterface::log_debug(const std::string_view &msg) {
        sdk.logger->Debug(handle, msg.data());
    }
    void AppInterface::log_info(const std::string_view &msg) {
        sdk.logger->Info(handle, msg.data());
    }
    void AppInterface::log_warning(const std::string_view &msg) {
        sdk.logger->Warn(handle, msg.data());
    }
    void AppInterface::log_error(const std::string_view &msg) {
        sdk.logger->Error(handle, msg.data());
    }
    void AppInterface::log_critical(const std::string_view &msg) {
        sdk.logger->Critical(handle, msg.data());
    }
}
