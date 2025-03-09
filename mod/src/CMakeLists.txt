add_library(gpsserver SHARED main.cpp updater.cpp app_interface.cpp)

target_link_libraries(gpsserver PRIVATE RED4ext::SDK wsock32 ws2_32 user32)
