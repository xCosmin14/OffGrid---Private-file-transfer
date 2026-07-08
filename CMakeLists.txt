cmake_minimum_required(VERSION 3.16)
set(CMAKE_AUTOMOC ON)

project(Demo1 VERSION 0.1 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(QT_QML_GENERATE_QMLLS_INI ON)

find_package(Qt6 REQUIRED COMPONENTS Quick Svg Core5Compat Network)

qt_standard_project_setup(REQUIRES 6.5)

# Content of downloaded design from Figma to Qt or similar
if (EXISTS "${CMAKE_CURRENT_LIST_DIR}/importedcontent/CMakeLists.txt")
    add_subdirectory(${CMAKE_CURRENT_LIST_DIR}/importedcontent)
endif()

qt_add_executable(appDemo1
    main.cpp
)

qt_add_qml_module(appDemo1
    URI Demo1

    SOURCES
        Account/SessionManager.cpp

        TextFiltering.h
        SessionManager.h


    QML_FILES
        Main.qml
        Header.qml
        Sidebar.qml

        Files/File.qml
        Files/MyFilesPage.qml
        Files/SharedFilesPage.qml
        Files/FavoritesPage.qml

        Files/MusicPage.qml
        Files/PhotosPage.qml
        Files/TrashPage.qml
        Files/DocumentsPage.qml
        Files/AddFile.qml
        Files/File.qml
        Files/FileSizeChart.qml
        Files/UploadProgress.qml
        Files/Filters.qml
        Files/MenuOption.qml
        Files/CustomDatePicker.qml

        Notifications/NotifFilePreview.qml
        Notifications/AcceptFriendNotification.qml
        Notifications/FilePreviewNotification.qml
        Notifications/ActionNotification.qml
        Notifications/TextNotification.qml

        Account/Settings.qml
        Account/Register.qml
        Account/Login.qml
        Account/ForgotPassword.qml

    RESOURCES
        assets/Logo.png
        assets/MockUserImg.jpg

        assets/svg/ArrowDown.svg
        assets/svg/ArrowRight.svg
        assets/svg/ArrowUp.svg
        assets/svg/Dots.svg
        assets/svg/EyeHide.svg
        assets/svg/EyeShow.svg
        assets/svg/HamburgerToggle.svg
        assets/svg/Moon.svg
        assets/svg/Notification.svg
        assets/svg/Search.svg
        assets/svg/Seen.svg
        assets/svg/Settings.svg
        assets/svg/StarFull.svg
        assets/svg/StarLine.svg
        assets/svg/Sun.svg

        assets/svg/FileIcons/Add.svg
        assets/svg/FileIcons/ChangeColor.svg
        assets/svg/FileIcons/Documents.svg
        assets/svg/FileIcons/Download.svg
        assets/svg/FileIcons/Folder.svg
        assets/svg/FileIcons/MusicLibrary.svg
        assets/svg/FileIcons/MyFiles.svg
        assets/svg/FileIcons/PhotoAlbum.svg
        assets/svg/FileIcons/Rename.svg
        assets/svg/FileIcons/TextFile.svg
        assets/svg/FileIcons/Trash.svg
        assets/svg/FileIcons/UploadFile.svg
        assets/svg/FileIcons/UserFiles.svg

        assets/svg/UserIcons/AcceptFriend.svg
        assets/svg/UserIcons/AddFriend.svg
        assets/svg/UserIcons/Email.svg
        assets/svg/UserIcons/Group.svg
        assets/svg/UserIcons/Password.svg
        assets/svg/UserIcons/RemoveFriend.svg
        assets/svg/UserIcons/User.svg
        assets/svg/UserIcons/UserIcon.svg
)

# Qt for iOS sets MACOSX_BUNDLE_GUI_IDENTIFIER automatically since Qt 6.1.
# If you are developing for iOS or macOS you should consider setting an
# explicit, fixed bundle identifier manually though.
set_target_properties(appDemo1 PROPERTIES
#    MACOSX_BUNDLE_GUI_IDENTIFIER com.example.appDemo1
    MACOSX_BUNDLE_BUNDLE_VERSION ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

target_link_libraries(appDemo1
    PRIVATE Qt6::Quick Qt6::Svg Qt6::Core5Compat Qt6::Network
)

install(TARGETS appDemo1
    BUNDLE DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)
