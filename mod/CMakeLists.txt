cmake_minimum_required(VERSION 3.12)

project(gpsserver LANGUAGES CXX)

set_property(GLOBAL PROPERTY USE_FOLDERS ON)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED YES)

# Add RED4ext.SDK as a dependency.

add_subdirectory(deps/red4ext.sdk)
set_target_properties(RED4ext.SDK PROPERTIES FOLDER "Dependencies")

mark_as_advanced(
    RED4EXT_BUILD_EXAMPLES
    RED4EXT_HEADER_ONLY
)

add_subdirectory(src)
