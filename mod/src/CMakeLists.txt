add_library(nightcitynav SHARED main.cpp updater.cpp app_interface.cpp)

target_link_libraries(nightcitynav PRIVATE RED4ext::SDK wsock32 ws2_32 user32)
