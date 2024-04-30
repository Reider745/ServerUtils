ModAPI.registerAPI("ServerUtils", {
    CommandRegistry,
    Command,
    CommandArgType,
    CommandUtils,

    Permission,
    UsersStorage,

    Auction,

    DailyQuest,
    Daily,

    GlobalSaves,
    PopupWindow,
    EnumHelp,

    Utils: {
        alert_message,
        message,
        setPositionPlayer
    },

    PrivatePermission,
    PrivateZoneBase,
    PrivateZoneDimension,
    PrivateZoneFullPos,
    PrivatesStorage,

    requireGlobal(cmd){
        return eval(cmd);
    }
});