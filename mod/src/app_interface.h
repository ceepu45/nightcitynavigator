#pragma once

#include <RED4ext/RED4ext.hpp>

namespace GpsServer {
    class AppInterface {
       public:
        AppInterface(RED4ext::PluginHandle handle, const RED4ext::Sdk *sdk)
            : handle(handle), sdk(*sdk) {}

        void log_trace(const std::string_view &msg);
        void log_debug(const std::string_view &msg);
        void log_info(const std::string_view &msg);
        void log_warning(const std::string_view &msg);
        void log_error(const std::string_view &msg);
        void log_critical(const std::string_view &msg);

        template <typename... Args>
        void log_trace(std::format_string<Args...> format, Args &&...args) {
            log_trace(std::format(format, std::forward<Args>(args)...));
        }

        template <typename... Args>
        void log_debug(std::format_string<Args...> format, Args &&...args) {
            log_debug(std::format(format, std::forward<Args>(args)...));
        }

        template <typename... Args>
        void log_info(std::format_string<Args...> format, Args &&...args) {
            log_info(std::format(format, std::forward<Args>(args)...));
        }

        template <typename... Args>
        void log_warning(std::format_string<Args...> format, Args &&...args) {
            log_warning(std::format(format, std::forward<Args>(args)...));
        }

        template <typename... Args>
        void log_error(std::format_string<Args...> format, Args &&...args) {
            log_error(std::format(format, std::forward<Args>(args)...));
        }

        template <typename... Args>
        void log_critical(std::format_string<Args...> format, Args &&...args) {
            log_critical(std::format(format, std::forward<Args>(args)...));
        }

       private:
        RED4ext::PluginHandle handle;
        const RED4ext::Sdk &sdk;
    };

    extern std::unique_ptr<AppInterface> app;
}
