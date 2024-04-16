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

    requireGlobal(cmd){
        return eval(cmd);
    }
});