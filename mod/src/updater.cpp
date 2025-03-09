#include <cstdint>

#define WIN32_LEAN_AND_MEAN

#include <WinSock2.h>
#include <ws2tcpip.h>

#include <RED4ext/RED4ext.hpp>
#include <RED4ext/Scripting/IScriptable.hpp>
#include <RED4ext/Scripting/Natives/ScriptGameInstance.hpp>
#include <RED4ext/Scripting/Natives/Vector4.hpp>

#include "app_interface.h"
#include "updater.h"

namespace GpsServer {

    SOCKET udp_socket;

    struct LocationInfo {
        std::uint32_t seconds;
        std::uint32_t nanos;
        std::uint32_t loc_type;

        // Position
        float x;
        float y;
        float z;

        // Rotation
        float i;
        float j;
        float k;
        float r;
    };

    struct TimeStamp {
        int64_t seconds;
        uint32_t nanos;
    };

    // Make sure LocationInfo is the right size, as it gets sent over the
    // network.
    static_assert(sizeof(LocationInfo) == 40, "Unexpected length of LocationInfo");

    static TimeStamp get_timestamp() {
        const std::int64_t UNIX_TIME_START = 0x019DB1DED53E8000;
        const std::int64_t TICKS_PER_SECOND = 10000000;
        const std::int64_t NANOS_PER_TICK = 100;

        FILETIME filetime;
        GetSystemTimeAsFileTime(&filetime);
        LARGE_INTEGER filetime64;
        filetime64.LowPart = filetime.dwLowDateTime;
        filetime64.HighPart = filetime.dwHighDateTime;

        const int64_t ticks = filetime64.QuadPart - UNIX_TIME_START;
        const int64_t seconds = ticks / TICKS_PER_SECOND;
        const uint32_t nanos = (ticks % TICKS_PER_SECOND) * NANOS_PER_TICK;

        return {
            .seconds = seconds,
            .nanos = nanos,
        };
    }

    bool running_enter(RED4ext::CGameApplication *aApp) {
        if (!app) {
            return true;
        }

        WSADATA wsa_data;
        int result;

        result = WSAStartup(MAKEWORD(2, 2), &wsa_data);
        if (result != 0) {
            app->log_error("Failed to initialize WinSock");
            return true;
        }

        udp_socket = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
        if (udp_socket == INVALID_SOCKET) {
            app->log_error("Failed to create UDP socket");
            return true;
        }

        sockaddr_in add;
        add.sin_family = AF_INET;
        InetPton(AF_INET, "127.0.0.1", &add.sin_addr.s_addr);
        int port = 52077;
        add.sin_port = htons(port);

        /*
           result = bind(udp_socket, (SOCKADDR *)&add, sizeof(add));
           if (result == SOCKET_ERROR) {
           app->log_error("Failed to bind UDP socket");
           return true;
           }
           */

        u_long mode = 1;
        ioctlsocket(udp_socket, FIONBIO, &mode);

        result = connect(udp_socket, (SOCKADDR *)&add, sizeof(add));

        // TODO init period from config

        app->log_info("GPS Server running on port {}", port);
        return true;
    }

    bool running_update(RED4ext::CGameApplication *aApp) {
        if (!app) {
            return false;
        }

        RED4ext::ScriptGameInstance game_instance;
        RED4ext::Handle<RED4ext::IScriptable> player_handle;

        bool status;
        status =
            RED4ext::ExecuteGlobalFunction("GetPlayer;GameInstance", &player_handle, game_instance);
        if (!status || !player_handle) {
            app->log_warning("Failed to get player");
            return false;
        }

        auto player_class = player_handle.GetPtr()->GetType();
        auto func = player_class->GetFunction("GetWorldPosition");

        RED4ext::Vector4 position;
        status = RED4ext::ExecuteFunction(player_handle, func, (void *)&position);
        if (!status) {
            app->log_warning("Failed to get position");
            return false;
        }

        func = player_class->GetFunction("GetWorldOrientation");
        RED4ext::Quaternion orientation;
        status = RED4ext::ExecuteFunction(player_handle, func, (void *)&orientation);
        if (!status) {
            app->log_warning("Failed to get orientation");
            return false;
        }

        auto timestamp = get_timestamp();

        const LocationInfo location = {
            .seconds = (uint32_t)timestamp.seconds,
            .nanos = timestamp.nanos,
            .loc_type = 0,
            .x = position.X,
            .y = position.Y,
            .z = position.Z,
            .i = orientation.i,
            .j = orientation.j,
            .k = orientation.k,
            .r = orientation.r,
        };

        int result = send(udp_socket, (const char *)&location, sizeof(location), 0);
        if (result == SOCKET_ERROR) {
            auto error = WSAGetLastError();
            // Ignore not connected errors, and just keep trying.
            if (error != WSAENOTCONN) {
                app->log_error("Failed to send UDP packet: {}", result);
            }
        }

        return false;
    }
    bool running_exit(RED4ext::CGameApplication *aApp) {
        closesocket(udp_socket);
        WSACleanup();
        return true;
    }
}
