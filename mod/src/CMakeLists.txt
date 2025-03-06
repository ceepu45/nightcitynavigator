add_library(gpsserver SHARED main.cpp)

target_link_libraries(gpsserver PRIVATE RED4ext::SDK)
