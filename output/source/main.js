function forEachEnum(anum_, func) {
    for (var key in anum_)
        if (!/^\d+$/.test(key))
            func(key, anum_[key]);
}
function translate(text, values) {
    var message = Translation.translate(text);
    if (values) {
        for (var i in values)
            message = message.replace("%v", values[i]);
    }
    return message;
}
function getName(id, data) {
    return Translation.translate(Item.getName(id, data));
}
function getMessage(packet) {
    if (packet.values)
        return translate(packet.message, packet.values[0]);
    return translate(packet.message, []);
}
Network.addClientPacket("server_utils.message_player", function (packet) {
    Game.message(getMessage(packet));
});
Network.addClientPacket("server_utils.alert_player", function (packet) {
    alert(getMessage(packet));
});
function message(client, message) {
    var values = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        values[_i - 2] = arguments[_i];
    }
    var packet = { message: message, values: values };
    client.send("server_utils.message_player", packet);
}
function alert_message(client, message) {
    var values = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        values[_i - 2] = arguments[_i];
    }
    var packet = { message: message, values: values };
    client.send("server_utils.alert_player", packet);
}
Network.addClientPacket("server_utils.setPositionPlayer", function (packet) {
    Player.setPosition(packet.x, packet.y, packet.z);
});
function setPositionPlayer(player, x, y, z) {
    Entity.setPosition(player, x, y, z);
    var client = Network.getClientForPlayer(player);
    var packet = { x: x, y: y, z: z };
    client && client.send("server_utils.setPositionPlayer", packet);
}
var EnumHelp = /** @class */ (function () {
    function EnumHelp(enum_obj) {
        this.posts = [];
        var self = this;
        forEachEnum(enum_obj, function (name, value) { return name != "MAX_VALUE" ? self.value = Math.max(self.value, value) : 0; });
        this.enum_obj = enum_obj;
    }
    EnumHelp.prototype.add = function (name) {
        this.enum_obj[this.enum_obj[name] = this.value] = name;
        this.value++;
        this.enum_obj[this.enum_obj["MAX_VALUE"] = this.value] = "MAX_VALUE";
        var value = ++this.value;
        for (var i in this.posts) {
            var name_1 = this.posts[i];
            this.enum_obj[this.enum_obj[name_1] = value] = name_1;
            value++;
        }
    };
    EnumHelp.prototype.addPost = function (name) {
        this.posts.push(name);
    };
    EnumHelp.prototype.get = function (name) {
        return this.enum_obj[name];
    };
    return EnumHelp;
}());
function angleFor2dVector(x1, y1, x2, y2) {
    var v = Math.acos((x1 * x2 + y1 * y2) / (Math.sqrt(x1 * x1 + y1 * y1) * Math.sqrt(x2 * x2 + y2 * y2)));
    return isNaN(v) ? 0 : v;
}
function angleFor3dVector(x1, y1, z1, x2, y2, z2) {
    var v = Math.acos((x1 * x2 + y1 * y2 + z1 * z2) / (Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1) * Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2)));
    return isNaN(v) ? 0 : v;
}
function rotateMesh(mesh, x1, x2, y1, y2, dx, dy, dz, radius) {
    var angleXZ = angleFor2dVector(0, radius, dx, dz);
    if (dx == 0 && dz == 0)
        var angleY = Math.PI / 2;
    else
        var angleY = angleFor3dVector(dx, 0, dz, dx, dy, dz);
    mesh.rotate(0 < y2 - y1 ? -angleY : angleY, 0 < x2 - x1 ? -angleXZ : angleXZ, 0);
}
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Permission;
(function (Permission) {
    Permission[Permission["USE_AUCTION"] = 0] = "USE_AUCTION";
    Permission[Permission["ADDED_ITEM_FOR_AUCTION"] = 1] = "ADDED_ITEM_FOR_AUCTION";
    Permission[Permission["LOW_LARGE_SALE"] = 2] = "LOW_LARGE_SALE";
    Permission[Permission["BIG_LARGE_SALE"] = 3] = "BIG_LARGE_SALE";
    Permission[Permission["CONTROL_MONEY"] = 4] = "CONTROL_MONEY";
    Permission[Permission["CONTROL_PERMISSION"] = 5] = "CONTROL_PERMISSION";
    Permission[Permission["CREATE_HOME"] = 6] = "CREATE_HOME";
    Permission[Permission["CREATE_WARP"] = 7] = "CREATE_WARP";
    Permission[Permission["USE_HOME"] = 8] = "USE_HOME";
    Permission[Permission["USE_WARP"] = 9] = "USE_WARP";
    Permission[Permission["REMOVE_WARP"] = 10] = "REMOVE_WARP";
    Permission[Permission["REMOVE_WARP_NOT_OWNER"] = 11] = "REMOVE_WARP_NOT_OWNER";
    Permission[Permission["SPAWN_COMMAND"] = 12] = "SPAWN_COMMAND";
    Permission[Permission["ACCESS_COMMAND"] = 13] = "ACCESS_COMMAND";
    Permission[Permission["WORLD_RENDER_TEXT_COMMAND"] = 14] = "WORLD_RENDER_TEXT_COMMAND";
    Permission[Permission["MAX_VALUE"] = 15] = "MAX_VALUE";
})(Permission || (Permission = {}));
;
var PermissionStorage = /** @class */ (function () {
    function PermissionStorage(permissions) {
        this.permissions = [];
        if (permissions) {
            for (var i = 0; i < permissions.length; i++)
                this.permissions[i] = permissions[i];
            if (Permission.MAX_VALUE != permissions.length)
                for (var i = permissions.length; i < Permission.MAX_VALUE; i++)
                    this.permissions[i] = 0;
        }
        else
            for (var i = 0; i < Permission.MAX_VALUE; i++)
                this.permissions[i] = 0;
    }
    PermissionStorage.prototype.setPermission = function (permission, value) {
        if (value === void 0) { value = 1; }
        this.permissions[permission] = value;
    };
    PermissionStorage.prototype.canPermission = function (permission) {
        return !!this.permissions[permission];
    };
    PermissionStorage.prototype.getPermissions = function () {
        return this.permissions;
    };
    return PermissionStorage;
}());
var User = /** @class */ (function () {
    function User(name, many) {
        this.user_name = name;
        this.many = many;
    }
    User.prototype.getUserName = function () {
        return this.user_name;
    };
    User.prototype.getMoney = function () {
        return this.many;
    };
    User.prototype.setMoney = function (many) {
        this.many = many;
    };
    User.prototype.addMoney = function (many) {
        this.setMoney(this.getMoney() + many);
    };
    User.prototype.toJson = function () {
        return {
            user_name: this.getUserName(),
            money: this.getMoney()
        };
    };
    User.prototype.getPlayerUid = function () {
        return -1;
    };
    return User;
}());
;
var ClientUser = /** @class */ (function (_super) {
    __extends(ClientUser, _super);
    function ClientUser(user_name, addedAuctionItem, many) {
        var _this = _super.call(this, user_name, many) || this;
        _this.addedAuctionItem = addedAuctionItem;
        return _this;
    }
    ClientUser.prototype.canAddedAuctionItem = function () {
        return this.addedAuctionItem;
    };
    ClientUser.prototype.getPlayerUid = function () {
        return Player.get();
    };
    ClientUser.fromJSON = function (json) {
        return new ClientUser(json.user_name, json.addedAuctionItem, json.money);
    };
    return ClientUser;
}(User));
var GLOBAL_PERMISSION = (function () {
    var permissions = new PermissionStorage([]);
    forEachEnum(Permission, function (name, value) { return permissions.setPermission(value, Number(__config__.get("global_permission." + name))); });
    return permissions;
})();
var ServerUser = /** @class */ (function (_super) {
    __extends(ServerUser, _super);
    function ServerUser(playerUid, name, addional, permissions, many) {
        if (addional === void 0) { addional = {}; }
        if (many === void 0) { many = 0; }
        var _this = _super.call(this, name, many) || this;
        _this.addional = {};
        _this.playerUid = playerUid;
        _this.addional = addional;
        _this.permissions = new PermissionStorage(permissions);
        return _this;
    }
    ServerUser.prototype.getPlayerUid = function () {
        return this.playerUid;
    };
    ServerUser.prototype.isOperator = function () {
        return new PlayerActor(this.playerUid).isOperator();
    };
    ServerUser.prototype.setPermission = function (permission, value) {
        if (value === void 0) { value = 1; }
        this.permissions.setPermission(permission, value);
    };
    ServerUser.prototype.canPermission = function (permission) {
        return this.isOperator() || this.permissions.canPermission(permission) || GLOBAL_PERMISSION.canPermission(permission);
    };
    ServerUser.prototype.toClientJson = function () {
        return {
            user_name: this.getUserName(),
            money: this.getMoney(),
            addedAuctionItem: this.canPermission(Permission.ADDED_ITEM_FOR_AUCTION)
        };
    };
    ServerUser.prototype.getData = function (name) {
        return this.addional[name];
    };
    ServerUser.prototype.getDataDef = function (name, def) {
        return this.getData(name) || def;
    };
    ServerUser.prototype.setData = function (name, data) {
        this.addional[name] = data;
    };
    ServerUser.prototype.toJson = function () {
        var json = _super.prototype.toJson.call(this);
        return {
            user_name: json.user_name,
            money: this.getMoney(),
            playerUid: this.playerUid,
            permissions: this.permissions.getPermissions(),
            addional: this.addional
        };
    };
    ServerUser.fromJSON = function (json) {
        return new ServerUser(json.playerUid, json.user_name, json.addional, json.permissions, json.money);
    };
    return ServerUser;
}(User));
var UsersStorage = /** @class */ (function () {
    function UsersStorage() {
    }
    UsersStorage.getUserIfCreate = function (playerUid) {
        var user = this.user_storage[playerUid];
        if (!user)
            return this.user_storage[playerUid] = new ServerUser(playerUid, Entity.getNameTag(playerUid));
        return user;
    };
    var _a;
    _a = UsersStorage;
    UsersStorage.user_storage = {};
    (function () {
        Callback.addCallback("ServerPlayerLoaded", function (playerUid) { return _a.getUserIfCreate(playerUid); });
        Saver.addSavesScope("server_utils.user_storage", function (scope) {
            var users = scope.users || {};
            var result = {};
            for (var key in users)
                result[key] = ServerUser.fromJSON(users[key]);
            _a.user_storage = result;
        }, function () {
            var users = {};
            for (var key in _a.user_storage)
                users[key] = _a.user_storage[key].toJson();
            return { users: users };
        });
        Callback.addCallback("LevelLeft", function () { return _a.user_storage = {}; });
    })();
    return UsersStorage;
}());
Translation.addTranslation("Error parse arguments, not found enum %v", {
    ru: "Ошибка чтения аргументов, не найдено в енуме %v"
});
Translation.addTranslation("Error parse arguments, not found player", {
    ru: "Ошибка чтения аргументов, не найден игрок"
});
Translation.addTranslation("Error parse arguments length args_types != raw_arfs", {
    ru: "Ошибка чтения аргументов args_types != raw_arfs"
});
Translation.addTranslation("Not permission use command", {
    ru: "Нет разрешения на использования комманды"
});
Translation.addTranslation("Error run command", {
    ru: "Ошибка при выполнении команды"
});
Translation.addTranslation("Create home, pos %v %v %v", {
    ru: "Создана точка дома, координаты %v %v %v"
});
Translation.addTranslation("Teleport from %v %v %v", {
    ru: "Телепортация в %v %v %v"
});
Translation.addTranslation("Not found warp %v", {
    ru: "Не найден warp %v"
});
Translation.addTranslation("You are not the owner of warp %v", {
    ru: "Вы не владелец warp %v"
});
Translation.addTranslation("You have reached the maximum number of warp or warp with the given name already exists", {
    ru: "Вы достигли лимита по warp или warp с данным именем уже есть"
});
Translation.addTranslation("Not found args_types", {
    ru: "Не найден нужный args_types"
});
var CommandUtils = /** @class */ (function () {
    function CommandUtils() {
    }
    CommandUtils.getPlayerByName = function (name) {
        var players = Network.getConnectedPlayers();
        for (var i in players) {
            var player = players[i];
            if (String(Entity.getNameTag(player)) == name)
                return player;
        }
        return null;
    };
    return CommandUtils;
}());
var CommandArgType;
(function (CommandArgType) {
    CommandArgType[CommandArgType["NUMBER"] = 0] = "NUMBER";
    CommandArgType[CommandArgType["STRING"] = 1] = "STRING";
    CommandArgType[CommandArgType["PLAYER"] = 2] = "PLAYER";
    CommandArgType[CommandArgType["BOOLEAN"] = 3] = "BOOLEAN";
    CommandArgType[CommandArgType["ENUM"] = 4] = "ENUM";
})(CommandArgType || (CommandArgType = {}));
var Command = /** @class */ (function () {
    function Command(args_types, enum_local) {
        this.commandsArgsTypes = [];
        this.permission = Permission.MAX_VALUE;
        this.args_types = args_types;
        this.enum_local = enum_local;
    }
    Command.prototype.addArgsTypes = function (types) {
        this.commandsArgsTypes.push(types);
    };
    Command.prototype.setPermissionUseCommand = function (permission) {
        this.permission = permission;
    };
    Command.prototype.getArgsTypes = function () {
        return this.args_types;
    };
    Command.prototype.splitCommand = function (command) {
        var args = [""];
        var str = false;
        for (var i = 0; i < command.length; i++) {
            var symbol = command.charAt(i);
            if (symbol == " " && !str)
                args.push("");
            if (symbol == "\"") {
                str = !str;
                continue;
            }
            if (symbol != " " || str)
                args[args.length - 1] += symbol;
        }
        args.shift();
        return args;
    };
    Command.prototype.parseArguments = function (client, raw_args, args_types) {
        if (!args_types) {
            if (this.args_types.length == raw_args.length)
                args_types = this.args_types;
            else
                for (var i in this.commandsArgsTypes) {
                    var types = this.commandsArgsTypes[i];
                    if (types.length == raw_args.length) {
                        args_types = types;
                        break;
                    }
                }
        }
        if (!args_types || args_types.length != raw_args.length) {
            this.message(client, "Error parse arguments length args_types != raw_arfs");
            return null;
        }
        var args = [];
        for (var i in raw_args) {
            var arg = raw_args[i];
            switch (args_types[i]) {
                case CommandArgType.NUMBER:
                    args.push(Number(arg));
                    break;
                case CommandArgType.STRING:
                    args.push(arg);
                    break;
                case CommandArgType.PLAYER:
                    if (arg == "@s")
                        args.push(client ? client.getPlayerUid() : Player.get());
                    else {
                        var playerUid = CommandUtils.getPlayerByName(arg);
                        if (!playerUid) {
                            this.message(client, "Error parse arguments, not found player %v", arg);
                            return null;
                        }
                        args.push(playerUid);
                    }
                    break;
                case CommandArgType.BOOLEAN:
                    args.push(arg == "true" || arg == "false");
                    break;
                case CommandArgType.ENUM:
                    var value = this.enum_local[arg.toUpperCase()];
                    if (typeof value == "string")
                        args.push(Number(value));
                    else if (value === undefined) {
                        this.message(client, "Error parse arguments, not found enum %v", arg.toUpperCase() + "\n" + JSON.stringify(this.enum_local));
                        return null;
                    }
                    args.push(value);
                    break;
            }
        }
        return args;
    };
    Command.prototype.canUseCommnad = function (player) {
        if (this.permission != Permission.MAX_VALUE && UsersStorage.getUserIfCreate(player).canPermission(this.permission))
            return true;
        return new PlayerActor(player).isOperator();
    };
    Command.prototype.message = function (client, text) {
        var values = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            values[_i - 2] = arguments[_i];
        }
        if (!client) {
            Game.message(getMessage({ message: text, values: values }));
            return;
        }
        message(client, text, values);
    };
    Command.prototype.runServer = function (client, args) {
        return true;
    };
    Command.prototype.runClient = function (raw_args) {
        return true;
    };
    return Command;
}());
var CommandGetAccess = /** @class */ (function (_super) {
    __extends(CommandGetAccess, _super);
    function CommandGetAccess(commands) {
        var _this = _super.call(this, []) || this;
        _this.commands = commands;
        _this.setPermissionUseCommand(Permission.ACCESS_COMMAND);
        return _this;
    }
    CommandGetAccess.prototype.runServer = function (client, args) {
        var msg = "====Access Command====";
        var playerUid = client.getPlayerUid();
        var _loop_1 = function (name) {
            var command = this_1.commands[name];
            if (command.canUseCommnad(playerUid)) {
                var args_types = command.getArgsTypes();
                var args_m_1 = "";
                for (var i in args_types) {
                    switch (args_types[i]) {
                        case CommandArgType.NUMBER:
                            args_m_1 += "number ";
                            break;
                        case CommandArgType.STRING:
                            args_m_1 += "string ";
                            break;
                        case CommandArgType.PLAYER:
                            args_m_1 += "player ";
                            break;
                        case CommandArgType.BOOLEAN:
                            args_m_1 += "boolean ";
                            break;
                        case CommandArgType.ENUM:
                            forEachEnum(command.enum_local, function (name, value) { return args_m_1 += name + "/"; });
                            args_m_1 += "";
                            break;
                    }
                }
                msg += "\n" + name;
            }
        };
        var this_1 = this;
        for (var name in this.commands) {
            _loop_1(name);
        }
        this.message(client, msg);
        return true;
    };
    return CommandGetAccess;
}(Command));
var CommandRegistry = /** @class */ (function () {
    function CommandRegistry() {
    }
    CommandRegistry.registry = function (name, command) {
        this.commands["/" + name] = command;
        Network.addServerPacket("server_utils.command.use_command." + name, function (client, packet) {
            if (packet.raw_args && command.canUseCommnad(client.getPlayerUid())) {
                var args = command.parseArguments(client, packet.raw_args);
                args && !command.runServer(client, args) && command.message(client, "Error run command");
            }
            else
                command.message(client, "Not permission use command");
        });
    };
    CommandRegistry.commands = {};
    (function () {
        var cmd = new CommandGetAccess(CommandRegistry.commands);
        CommandRegistry.registry("access", cmd);
        CommandRegistry.registry("h", cmd);
        Callback.addCallback("NativeCommand", function (cmd) {
            var name = cmd.split(" ")[0];
            var command = CommandRegistry.commands[name];
            if (command) {
                var raw_args = command.splitCommand(cmd);
                var packet = { raw_args: raw_args };
                var args = command.parseArguments(null, raw_args);
                if (args && command.runClient(args)) {
                    Network.sendToServer("server_utils.command.use_command." + name.replace("/", ""), packet);
                    Game.prevent();
                }
            }
        });
    })();
    return CommandRegistry;
}());
var GlobalSaves = /** @class */ (function () {
    function GlobalSaves() {
    }
    GlobalSaves.getData = function (name) {
        return _a.SAVES[name];
    };
    GlobalSaves.getDataDef = function (name, def) {
        return _a.getData(name) || def;
    };
    GlobalSaves.setData = function (name, data) {
        _a.SAVES[name] = data;
    };
    GlobalSaves.addHandler = function (handler) {
        this.handlers.push(handler);
    };
    var _a;
    _a = GlobalSaves;
    GlobalSaves.SAVES = {};
    GlobalSaves.handlers = [];
    (function () {
        Saver.addSavesScope("server_utils.global_saves", function (scope) {
            _a.SAVES = scope;
            for (var i in _a.handlers)
                _a.handlers[i].onRead();
        }, function () {
            for (var i in _a.handlers)
                _a.handlers[i].onSave();
            return _a.SAVES;
        });
        Callback.addCallback("LevelLeft", function () { return _a.SAVES = {}; });
    })();
    return GlobalSaves;
}());
var WorldRenderText = /** @class */ (function () {
    function WorldRenderText(x, y, z, rx, ry, rz, dim, text, scale, color) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.rx = rx;
        this.ry = ry;
        this.rz = rz;
        this.dim = dim;
        this.text = text;
        this.scale = scale;
        this.color = color;
        this.networkEntity = new NetworkEntity(_a.networkType, this);
    }
    WorldRenderText.buildMeshForText = function (text, scale, text_color) {
        if (scale === void 0) { scale = 1; }
        if (text_color === void 0) { text_color = [0, 0, 0, 0]; }
        var mesh = new RenderMesh();
        var def_scle = 7;
        var h_scale = 1 * (1 / def_scle * .75) * scale;
        var x = 0;
        var y = 0;
        var width = 0;
        var height = 0;
        mesh.setColor(text_color[0], text_color[1], text_color[2], text_color[3]);
        mesh.setNormal(0, 0, 1);
        for (var i = 0; i < text.length; i++) {
            var symbol = text.charAt(i);
            if (symbol == "\n") {
                y -= h_scale;
                height = Math.max(height, Math.abs(y));
                x = 0;
                continue;
            }
            else if (symbol == " ") {
                x += this.symbols["A"].w * def_scle * scale;
                continue;
            }
            var info = this.symbols[symbol];
            if (!info)
                continue;
            var w_scale = info.w * def_scle * scale;
            mesh.addVertex(x, y, 0, info.x, info.y + info.h);
            mesh.addVertex(x + w_scale, y, 0, info.x + info.w, info.y + info.h);
            mesh.addVertex(x, y + h_scale, 0, info.x, info.y);
            mesh.addVertex(x + w_scale, y, 0, info.x + info.w, info.y + info.h);
            mesh.addVertex(x, y + h_scale, 0, info.x, info.y);
            mesh.addVertex(x + w_scale, y + h_scale, 0, info.x + info.w, info.y);
            x += w_scale;
            width = Math.max(width, x);
        }
        mesh.translate(-width / 2, height / 2, 0);
        return { mesh: mesh, w: width, h: height };
    };
    WorldRenderText.prototype.remove = function () {
        this.networkEntity.remove();
    };
    WorldRenderText.prototype.toJSON = function () {
        return { x: this.x, y: this.z, z: this.z, dim: this.dim, text: this.text, scale: this.scale, rx: this.rx,
            ry: this.ry,
            rz: this.rz, color: this.color };
    };
    WorldRenderText.fromJSON = function (json) {
        return new _a(json.x, json.y, json.z, json.rx, json.ry, json.rz, json.dim, json.text, json.scale, json.color);
    };
    var _a;
    _a = WorldRenderText;
    WorldRenderText.symbols = FileTools.ReadJSON(__dir__ + "resources/assets/font_sprite_dump.json");
    (function () {
        _a.networkType = new NetworkEntityType("world_render_text");
        _a.networkType.setClientAddPacketFactory(function (target, entity, client) {
            return {
                x: target.x,
                y: target.y,
                z: target.z,
                rx: target.rx,
                ry: target.ry,
                rz: target.rz,
                text: target.text,
                scale: target.scale,
                color: target.color
            };
        });
        _a.networkType.setClientEntityAddedListener(function (entity, packet) {
            var hex = android.graphics.Color.parseColor(packet.color);
            var info = _a.buildMeshForText(packet.text, packet.scale, [
                ((hex >> 24) & 0xFF) / 256, ((hex >> 16) & 0xFF) / 256, ((hex >> 8) & 0xFF) / 256, (hex & 0xFF) / 256
            ]);
            var anim = new Animation.Base(packet.x, packet.y, packet.z);
            rotateMesh(info.mesh, packet.x, packet.y, packet.z, packet.y + packet.ry, packet.rx, packet.ry, packet.rz, 1);
            anim.describe({
                mesh: info.mesh,
                skin: "font_sprite.png"
            });
            anim.load();
            return { x: packet.x, y: packet.y, z: packet.z, anim: anim };
        });
        _a.networkType.setClientEntityRemovedListener(function (target, entity) {
            target.anim.destroy();
        });
        _a.networkType.setClientListSetupListener(function (list, target, entity) {
            list.setupDistancePolicy(target.x, target.y, target.z, target.dim, 64);
        });
    })();
    return WorldRenderText;
}());
var ServerRenderTextController = /** @class */ (function () {
    function ServerRenderTextController(id) {
        var _this = this;
        this.id = id;
        var self = this;
        Saver.addSavesScope("server_utils.world_render_text." + id, function (scope) {
            var renders = {};
            for (var id_1 in scope.renders)
                renders[id_1] = WorldRenderText.fromJSON(scope.renders[id_1]);
            self.list = renders;
        }, function () {
            var renders = {};
            for (var id_2 in _this.list)
                renders[id_2] = _this.list[id_2].toJSON();
            return { renders: renders };
        });
    }
    ServerRenderTextController.prototype.remove = function (x, y, z, dim) {
        for (var id in this.list) {
            var text = this.list[id];
            if (text.x == x && text.y == y && text.z == z && text.dim == dim) {
                delete this.list[id];
                return id;
            }
        }
        return null;
    };
    ServerRenderTextController.prototype.removeId = function (id) {
        var world = this.list[id];
        if (world) {
            world.remove();
            delete this.list[id];
            return id;
        }
        return null;
    };
    ServerRenderTextController.prototype.add = function (x, y, z, rx, ry, rz, dim, text, scale, color) {
        if (scale === void 0) { scale = 2; }
        if (color === void 0) { color = "#000000"; }
        var id = String(java.util.UUID.randomUUID().toString());
        this.removeId(id);
        this.list[id] = new WorldRenderText(x, y, z, rx, ry, rz, dim, text, scale, color);
        return id;
    };
    return ServerRenderTextController;
}());
var DEF_RENDER_CONTROOLER = new ServerRenderTextController("def");
Translation.addTranslation("Added rendering text %v", {
    ru: "Добавлен отрисовочный текст %v"
});
Translation.addTranslation("Removed rendering text %v", {
    ru: "Удален отрисовочный текст %v"
});
Translation.addTranslation("Not found rendering text %v", {
    ru: "Не найден отрисовочный текст %v"
});
var WorldRenderCommand = /** @class */ (function (_super) {
    __extends(WorldRenderCommand, _super);
    function WorldRenderCommand(controller) {
        var _this = _super.call(this, [CommandArgType.STRING, CommandArgType.NUMBER]) || this; //Добавить текст
        _this.setPermissionUseCommand(Permission.WORLD_RENDER_TEXT_COMMAND);
        _this.addArgsTypes([CommandArgType.STRING, CommandArgType.NUMBER, CommandArgType.STRING]); //Добавить текст выбрав цвет
        _this.addArgsTypes([CommandArgType.STRING]); //Удалить текст(нужен uuid)
        _this.controller = controller;
        return _this;
    }
    WorldRenderCommand.prototype.runServer = function (client, args) {
        var playerUid = client.getPlayerUid();
        if (args.length >= 2) {
            var pos = Entity.getPosition(playerUid);
            var vec = Entity.getLookVector(playerUid);
            var color = "#000000";
            if (args.length == 3)
                color = args[2];
            while (args[0].indexOf("\\n") != -1)
                args[0] = args[0].replace("\\n", "\n");
            this.message(client, "Added rendering text %v", this.controller.add(pos.x, pos.y, pos.z, vec.x, vec.y, vec.z, Entity.getDimension(playerUid), args[0], args[1], color));
        }
        else {
            var id = this.controller.removeId(args[0]);
            if (id) {
                this.message(client, "Removed rendering text %v", id);
                return true;
            }
            this.message(client, "Not found rendering text %v", args[0]);
        }
        return true;
    };
    return WorldRenderCommand;
}(Command));
CommandRegistry.registry("rendertext", new WorldRenderCommand(DEF_RENDER_CONTROOLER));
var CommandSetHome = /** @class */ (function (_super) {
    __extends(CommandSetHome, _super);
    function CommandSetHome() {
        var _this = _super.call(this, []) || this;
        _this.setPermissionUseCommand(Permission.CREATE_HOME);
        return _this;
    }
    CommandSetHome.prototype.runServer = function (client, args) {
        var playerUid = client.getPlayerUid();
        var pos = Entity.getPosition(playerUid);
        UsersStorage.getUserIfCreate(playerUid)
            .setData("home", {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            d: Entity.getDimension(playerUid)
        });
        this.message(client, "Create home, pos %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
        return true;
    };
    return CommandSetHome;
}(Command));
var CommandHome = /** @class */ (function (_super) {
    __extends(CommandHome, _super);
    function CommandHome() {
        var _this = _super.call(this, []) || this;
        _this.setPermissionUseCommand(Permission.USE_HOME);
        return _this;
    }
    CommandHome.prototype.runServer = function (client, args) {
        var playerUid = client.getPlayerUid();
        var point = UsersStorage.getUserIfCreate(playerUid).getData("home");
        if (point) {
            var pos = Entity.getPosition(playerUid);
            setPositionPlayer(playerUid, point.x, point.y, point.z);
            Dimensions.transfer(playerUid, point.d);
            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
            return true;
        }
        return false;
    };
    return CommandHome;
}(Command));
CommandRegistry.registry("sethome", new CommandSetHome());
CommandRegistry.registry("home", new CommandHome());
var MAX_WARP_DEF = __config__.getInteger("warp_default_counts");
var CommandSetWarp = /** @class */ (function (_super) {
    __extends(CommandSetWarp, _super);
    function CommandSetWarp() {
        var _this = _super.call(this, [CommandArgType.STRING]) || this;
        _this.setPermissionUseCommand(Permission.CREATE_WARP);
        return _this;
    }
    CommandSetWarp.prototype.runServer = function (client, args) {
        var warp_playrs = GlobalSaves.getDataDef("warp_players", {});
        var playerUid = client.getPlayerUid();
        var user = UsersStorage.getUserIfCreate(playerUid);
        var user_name = user.getUserName();
        var count = warp_playrs[user_name] || 0;
        var warps = GlobalSaves.getDataDef("warps", {});
        if (!warps[args[0]] && (user.isOperator() || count < user.getDataDef("warps_count", MAX_WARP_DEF))) {
            var pos = Entity.getPosition(playerUid);
            warp_playrs[user_name] = count + 1;
            warps[args[0]] = {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                d: Entity.getDimension(playerUid),
                o: user_name
            };
            GlobalSaves.setData("warp_players", warp_playrs);
            GlobalSaves.setData("warps", warps);
            this.message(client, "Create warp %v", args[0]);
            return true;
        }
        this.message(client, "You have reached the maximum number of warp or warp with the given name already exists");
        return false;
    };
    return CommandSetWarp;
}(Command));
var CommandWarp = /** @class */ (function (_super) {
    __extends(CommandWarp, _super);
    function CommandWarp() {
        var _this = _super.call(this, [CommandArgType.STRING]) || this;
        _this.setPermissionUseCommand(Permission.USE_WARP);
        return _this;
    }
    CommandWarp.prototype.runServer = function (client, args) {
        var warp = GlobalSaves.getDataDef("warps", {})[args[0]];
        if (warp) {
            var playerUid = client.getPlayerUid();
            var pos = Entity.getPosition(playerUid);
            setPositionPlayer(playerUid, warp.x, warp.y, warp.z);
            Dimensions.transfer(playerUid, warp.d);
            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
            return true;
        }
        this.message(client, "Not found warp %v", args[0]);
        return false;
    };
    return CommandWarp;
}(Command));
var CommandRemoveWarp = /** @class */ (function (_super) {
    __extends(CommandRemoveWarp, _super);
    function CommandRemoveWarp() {
        var _this = _super.call(this, [CommandArgType.STRING]) || this;
        _this.setPermissionUseCommand(Permission.REMOVE_WARP);
        return _this;
    }
    CommandRemoveWarp.prototype.runServer = function (client, args) {
        var warps = GlobalSaves.getDataDef("warps", {});
        var name = args[0];
        if (!warps[name]) {
            var warp_playrs = GlobalSaves.getDataDef("warp_players", {});
            var user = UsersStorage.getUserIfCreate(client.getPlayerUid());
            var owner = warps[name].o;
            if (user.getUserName() != owner && !user.canPermission(Permission.REMOVE_WARP_NOT_OWNER)) {
                this.message(client, "You are not the owner of warp %v", args[0]);
                return false;
            }
            try {
                delete warps[name];
                warp_playrs[owner]--;
            }
            catch (e) {
                this.message(client, e);
                warp_playrs[owner] = 0;
            }
            return true;
        }
        this.message(client, "Not found warp %v", args[0]);
        return false;
    };
    return CommandRemoveWarp;
}(Command));
CommandRegistry.registry("setwarp", new CommandSetWarp());
CommandRegistry.registry("warp", new CommandWarp());
CommandRegistry.registry("removewarp", new CommandRemoveWarp());
var CommandPermission = /** @class */ (function (_super) {
    __extends(CommandPermission, _super);
    function CommandPermission() {
        var _this = _super.call(this, [CommandArgType.PLAYER, CommandArgType.ENUM, CommandArgType.BOOLEAN], Permission) || this;
        _this.setPermissionUseCommand(Permission.CONTROL_PERMISSION);
        _this.addArgsTypes([CommandArgType.PLAYER]);
        return _this;
    }
    CommandPermission.prototype.runServer = function (client, args) {
        var user = UsersStorage.getUserIfCreate(args[0]);
        if (args.length == 3) {
            var v = args[2] ? 1 : 0;
            user.setPermission(args[1], v);
            this.message(client, "Successfully edit permission, status: %v", v);
            return true;
        }
        var msg = Entity.getNameTag(args[0]);
        forEachEnum(Permission, function (name, value) { return msg += "\nPermission: " + name + " = " + user.canPermission(value); });
        this.message(client, msg);
        return true;
    };
    return CommandPermission;
}(Command));
CommandRegistry.registry("pm", new CommandPermission());
var ManyControl;
(function (ManyControl) {
    ManyControl[ManyControl["ADD"] = 0] = "ADD";
    ManyControl[ManyControl["SET"] = 1] = "SET";
})(ManyControl || (ManyControl = {}));
var CommandMoney = /** @class */ (function (_super) {
    __extends(CommandMoney, _super);
    function CommandMoney() {
        var _this = _super.call(this, [CommandArgType.PLAYER, CommandArgType.ENUM, CommandArgType.NUMBER], ManyControl) || this;
        _this.setPermissionUseCommand(Permission.CONTROL_MONEY);
        _this.addArgsTypes([CommandArgType.PLAYER]);
        return _this;
    }
    CommandMoney.prototype.runServer = function (client, args) {
        var user = UsersStorage.getUserIfCreate(args[0]);
        if (args.length != 3) {
            this.message(client, "User money: " + user.getMoney());
            return true;
        }
        switch (args[1]) {
            case ManyControl.ADD:
                user.addMoney(args[2]);
                break;
            case ManyControl.SET:
                user.setMoney(args[2]);
                break;
        }
        this.message(client, "User money: " + user.getMoney());
        return true;
    };
    return CommandMoney;
}(Command));
CommandRegistry.registry("money", new CommandMoney());
var CommandSetSpawn = /** @class */ (function (_super) {
    __extends(CommandSetSpawn, _super);
    function CommandSetSpawn() {
        return _super.call(this, []) || this;
    }
    CommandSetSpawn.prototype.runServer = function (client, args) {
        var pos = Entity.getPosition(client.getPlayerUid());
        GlobalSaves.setData("spawn", {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            d: Entity.getDimension(client.getPlayerUid())
        });
        this.message(client, "Successfully set spawn");
        return true;
    };
    return CommandSetSpawn;
}(Command));
var CommandSpawn = /** @class */ (function (_super) {
    __extends(CommandSpawn, _super);
    function CommandSpawn() {
        var _this = _super.call(this, []) || this;
        _this.setPermissionUseCommand(Permission.SPAWN_COMMAND);
        return _this;
    }
    CommandSpawn.prototype.canUseCommnad = function (player) {
        return _super.prototype.canUseCommnad.call(this, player) && !!GlobalSaves.getData("spawn");
    };
    CommandSpawn.prototype.runServer = function (client, args) {
        var spawn = GlobalSaves.getData("spawn");
        if (spawn) {
            var playerUid = client.getPlayerUid();
            var pos = Entity.getPosition(playerUid);
            setPositionPlayer(playerUid, spawn.x, spawn.y, spawn.z);
            Dimensions.transfer(playerUid, spawn.d);
            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
            return true;
        }
        return false;
    };
    return CommandSpawn;
}(Command));
CommandRegistry.registry("setspawn", new CommandSetSpawn());
CommandRegistry.registry("spawn", new CommandSpawn());
var PopupWindow = /** @class */ (function () {
    function PopupWindow() {
    }
    PopupWindow.prototype.update = function (dialog, addional) {
        dialog.setStyle(new MinecraftDialogStyle(undefined, [0, 0, 0, 0]));
        dialog.setEnableExitButton(false);
    };
    PopupWindow.prototype.newUi = function (addional) {
        return new UiDialogSetting("");
    };
    PopupWindow.prototype.open = function (x, y, addional) {
        if (this.ui && this.ui.getUi().isOpened())
            this.ui.close();
        var ui = this.ui = this.newUi(addional);
        this.update(ui, addional);
        ui.setPos(x, y);
        ui.build();
        ui.open();
    };
    PopupWindow.prototype.getDialog = function () {
        return this.ui;
    };
    PopupWindow.newDefaultStyle = function (title) {
        var dialog = new UiDialogSetting(title);
        dialog.setStyle(new MinecraftDialogStyle(undefined, [0, 0, 0, 0]));
        dialog.setEnableExitButton(false);
        return dialog;
    };
    return PopupWindow;
}());
var FRAME_OFFSET = 30;
var SIZE_TAB = UI.getScreenHeight() / 6;
var BUTTON_EXIT_TEXTURE = "X";
var Y_OFFSET = 10;
var TAB_OFFSET = 18;
var MAIN_FRAME_SCALE = 4;
var TAB_FRAME_SCALE = MAIN_FRAME_SCALE * 6;
var OFFSET_BETWEEN_TABS = 5;
var COUNT_ITEM_SLOTS_PLUS = 4;
var FRAME_TEXTURE = "minecraft_frame";
var LEFT_TEXTURE = "left_tab";
var RIGHT_TEXTURE = "right_tab";
var ADDED_TEXTURE = "add";
var ADDED_TEXTURE2 = "add_gray";
var ItemAuction = /** @class */ (function () {
    function ItemAuction(item, price, owner, uuid) {
        if (uuid === void 0) { uuid = String(java.util.UUID.randomUUID().toString()); }
        this.item = item;
        this.price = price;
        this.owner = owner;
        this.uuid = uuid;
        this.updateInformation();
    }
    ItemAuction.prototype.getPrice = function () {
        return this.price;
    };
    ItemAuction.prototype.getItem = function () {
        return this.item;
    };
    ItemAuction.prototype.getOwner = function () {
        return this.owner;
    };
    ItemAuction.prototype.getName = function () {
        return getName(this.item.id, this.item.data);
    };
    ItemAuction.prototype.getUUID = function () {
        return this.uuid;
    };
    ItemAuction.prototype.updateInformation = function () {
    };
    ItemAuction.prototype.toJSON = function () {
        return {
            price: this.price,
            uuid: this.uuid,
            item: {
                id: this.item.id,
                count: this.item.count,
                data: this.item.data,
                extra: this.item.extra
            },
            owner: this.owner.getUserName()
        };
    };
    return ItemAuction;
}());
;
var DescriptionItemAuction = /** @class */ (function (_super) {
    __extends(DescriptionItemAuction, _super);
    function DescriptionItemAuction() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DescriptionItemAuction.prototype.newUi = function (addional) {
        return addional.dialog;
    };
    DescriptionItemAuction.popup = new DescriptionItemAuction();
    return DescriptionItemAuction;
}(PopupWindow));
var ClientItemAuction = /** @class */ (function (_super) {
    __extends(ClientItemAuction, _super);
    function ClientItemAuction() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClientItemAuction.prototype.updateInfo = function (user) {
        this.dialog = new UiDialogSetting(this.getName());
        this.dialog.add(new Setting.SettingTextElement(translate("Price: %v", [this.getPrice()])));
        this.dialog.add(new Setting.SettingTextElement(translate("Your money: %v", [user.getMoney()])));
        this.dialog.add(new Setting.SettingTextElement(translate("Owner: %v", [this.getOwner().getUserName()])));
        var self = this;
        this.dialog.add(new Setting.SettingButtonTextElement(translate("buy", [])).setClick(function (dialog) {
            self.list_builder.buy(self);
            dialog.close();
        }));
    };
    ClientItemAuction.prototype.show = function (list_builder, x, y) {
        this.list_builder = list_builder;
        DescriptionItemAuction.popup.open(x, y, this);
    };
    ClientItemAuction.fromJSON = function (json) {
        return new ClientItemAuction(json.item, json.price, new ClientUser(json.owner, false, 0), json.uuid);
    };
    return ClientItemAuction;
}(ItemAuction));
var TouchEventType = com.zhekasmirnov.innercore.api.mod.ui.types.TouchEventType;
var ListBuilderAuctionItem = /** @class */ (function () {
    function ListBuilderAuctionItem(name) {
        this.slot_size = 60;
        this.count_slots = 0;
        this.list = [];
        this.name = name;
    }
    ListBuilderAuctionItem.prototype.setSlotSize = function (size) {
        this.slot_size = size;
        return this;
    };
    ListBuilderAuctionItem.prototype.addItemAuction = function (item) {
        this.list.push(item);
        return this;
    };
    ListBuilderAuctionItem.prototype.setItems = function (packet) {
        this.list = [];
        for (var i in packet.items)
            this.list.push(ClientItemAuction.fromJSON(packet.items[i]));
    };
    ListBuilderAuctionItem.prototype.buy = function (auctionItem) {
        var packet = {
            uuid: auctionItem.getUUID()
        };
        Network.sendToServer("auction." + this.name + ".buy", packet);
    };
    ListBuilderAuctionItem.prototype.getCountItems = function () {
        return this.list.length;
    };
    ListBuilderAuctionItem.prototype.updateSize = function (offset) {
        if (offset === void 0) { offset = 0; }
        var display_height = UI.getScreenHeight();
        this.count_slots = 0;
        for (var height = 0; height + this.slot_size <= display_height - offset * 2; height += this.slot_size) {
            this.count_slots++;
        }
        this.ui_size = height;
        return height;
    };
    ListBuilderAuctionItem.prototype.getLineSlots = function () {
        return this.count_slots + COUNT_ITEM_SLOTS_PLUS;
    };
    ListBuilderAuctionItem.prototype.getCountslots = function () {
        return this.count_slots;
    };
    ListBuilderAuctionItem.prototype.buidlUi = function (window, y, user, offset_list) {
        var elements = {};
        var drawing = [
            { type: "color", color: android.graphics.Color.argb(0, 0, 0, 0) }
        ];
        var width_size = this.ui_size / this.getCountslots() * this.getLineSlots();
        var location = new UI.WindowLocation({
            x: 500 - width_size / 2,
            y: y,
            width: width_size,
            height: this.ui_size
        });
        var size = location.globalToWindow(this.slot_size);
        var i = offset_list;
        var self = this;
        for (var y_1 = 0; y_1 < this.count_slots; y_1++) {
            var _loop_2 = function (x) {
                if (i >= this_2.list.length)
                    return "break";
                var auction_item = this_2.list[i];
                auction_item.updateInfo(user);
                var pos_x = x * size;
                var pos_y = y_1 * size;
                elements[x + ":" + y_1] = {
                    type: "slot",
                    x: pos_x,
                    y: pos_y,
                    source: auction_item.getItem(),
                    size: size,
                    bitmap: "_default_slot_empty",
                    visual: true,
                    onTouchEvent: function (qfa, event) {
                        event.type == TouchEventType.MOVE && auction_item.show(self, location.x + location.windowToGlobal(event.x), location.y + location.windowToGlobal(event.y));
                    },
                    clicker: {
                        onClick: function () {
                            auction_item.show(self, location.x + location.windowToGlobal(pos_x), location.y + location.windowToGlobal(pos_y));
                        }
                    }
                };
                i++;
            };
            var this_2 = this;
            for (var x = 0; x < this.getLineSlots(); x++) {
                var state_1 = _loop_2(x);
                if (state_1 === "break")
                    break;
            }
        }
        window.setContent({
            location: location.asScriptable(),
            drawing: drawing,
            elements: elements
        });
    };
    return ListBuilderAuctionItem;
}());
;
var ServerItemAuction = /** @class */ (function (_super) {
    __extends(ServerItemAuction, _super);
    function ServerItemAuction(item, price, owner, uuid) {
        var _this = _super.call(this, item, price, owner, uuid) || this;
        _this.flag = false;
        return _this;
    }
    ServerItemAuction.prototype.toClientJson = function () {
        return _super.prototype.toJSON.call(this);
    };
    ServerItemAuction.prototype.toJSON = function () {
        var json = _super.prototype.toJSON.call(this);
        json.playerUid = this.getOwner().getPlayerUid();
        return json;
    };
    ServerItemAuction.prototype.lock = function () {
        this.flag = true;
    };
    ServerItemAuction.prototype.unlock = function () {
        this.flag = false;
    };
    ServerItemAuction.prototype.canLock = function () {
        return this.flag;
    };
    ServerItemAuction.fromJSON = function (json) {
        return new ServerItemAuction(json.item, json.price, UsersStorage.getUserIfCreate(json.playerUid), json.uuid);
    };
    return ServerItemAuction;
}(ItemAuction));
var ServerItemStorage = /** @class */ (function () {
    function ServerItemStorage(name, items) {
        if (items === void 0) { items = {}; }
        this.items = {};
        this.items = items;
        var self = this;
        Saver.addSavesScope("server_utils.auction.item_storage." + name, function (scope) {
            var items = {};
            for (var uuid in scope.items)
                items[uuid] = ServerItemAuction.fromJSON(scope.items[uuid]);
            self.items = items;
        }, function () {
            return self.toJSON();
        });
        Callback.addCallback("LevelLeft", function () { return self.items = {}; });
    }
    ServerItemStorage.prototype.add = function (item) {
        this.items[item.getUUID()] = item;
    };
    ServerItemStorage.prototype.get = function (uuid) {
        return this.items[uuid];
    };
    ServerItemStorage.prototype.remove = function (uuid) {
        delete this.items[uuid];
    };
    ServerItemStorage.prototype.toSendClient = function () {
        var items = [];
        for (var i in this.items) {
            var item = this.items[i];
            items.push(item.toClientJson());
        }
        return { items: items };
    };
    ServerItemStorage.prototype.toJSON = function () {
        var items = {};
        for (var key in this.items)
            items[key] = this.items[key].toJSON();
        return { items: items };
    };
    return ServerItemStorage;
}());
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var CustomItemSelected = /** @class */ (function (_super) {
    __extends(CustomItemSelected, _super);
    function CustomItemSelected() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CustomItemSelected.prototype.build = function () {
        _super.prototype.build.call(this);
        var content = this.getUi().getContent();
        var self = this;
        content.elements["search"].clicker.onClick = function () {
            new Keyboard("")
                .getText(function (text) {
                var e_1, _a;
                var _items = [];
                try {
                    for (var _b = __values(self.full_list), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var item = _c.value;
                        if (Translation.translate(Item.getName(item._id, 0)).toLowerCase().split(text.toLowerCase()).length > 1)
                            _items.push(item);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                self.close();
                self.list = 0;
                self.items = _items;
                self.openCenter();
            })
                .open();
        };
        content.elements["search"].clicker.onLongClick = function () {
            self.close();
            self.list = 0;
            self.items = self.full_list;
            self.openCenter();
        };
        return this;
    };
    return CustomItemSelected;
}(SelectedItemDialog));
var SettingInventoryItemSelectedElement = /** @class */ (function (_super) {
    __extends(SettingInventoryItemSelectedElement, _super);
    function SettingInventoryItemSelectedElement() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SettingInventoryItemSelectedElement.prototype.build = function (dialog, content, org_size, size, id) {
        var items = [];
        for (var slot = 0; slot < 36; slot++) {
            var item = Player.getInventorySlot(slot);
            item.id != 0 && items.push({
                id: "",
                _id: item.id,
                fullId: "",
                tag: "",
                slot: slot,
            });
        }
        if (items.length <= 0) {
            this.item = { id: "", _id: 0, fullId: "", tag: "" };
            var result_1 = _super.prototype.build.call(this, dialog, content, org_size, size, id);
            result_1[0].clicker.onClick = function () { };
            dialog.configs[this.configName] = this.item;
            return result_1;
        }
        this.item = this.item || items[0];
        dialog.configs[this.configName] = this.item;
        var result = _super.prototype.build.call(this, dialog, content, org_size, size, id);
        var self = this;
        result[0].clicker.onClick = function () {
            var item_selected = new CustomItemSelected("Selected item");
            item_selected.setStyle(new MinecraftDialogStyle());
            item_selected.items = items;
            item_selected.full_list = items;
            item_selected.getSelectedItem(function (item) {
                dialog.configs[self.configName] = item;
                self.item = item;
                dialog.close();
                dialog.build();
                dialog.openCenter();
            })
                .openCenter();
        };
        return result;
    };
    return SettingInventoryItemSelectedElement;
}(Setting.SettingIconElement));
var Auction = /** @class */ (function () {
    function Auction(name) {
        this.container = new ItemContainer();
        this.list_builder = new ListBuilderAuctionItem(name);
        this.name = name;
        var self = this;
        ItemContainer.registerScreenFactory("auction." + name, function (container, screen_name) {
            return self.buildUI(screen_name, container);
        });
        this.container.setClientContainerTypeName("auction." + name);
        this.server_list = new ServerItemStorage(name);
        Network.addServerPacket("auction." + name + ".addItem", function (client, packet) { return self.addItem(client, client.getPlayerUid(), packet.slot, packet.price); });
        Network.addServerPacket("auction." + name + ".buy", function (client, packet) {
            var item_auction = self.server_list.get(packet.uuid);
            item_auction && self.buy(client, item_auction);
        });
    }
    Auction.prototype.buy = function (client, item) {
        if (item.canLock()) {
            alert_message(client, "It is not possible to process the transaction, the transaction is being processed with another player");
            return;
        }
        item.lock();
        try {
            var user = UsersStorage.getUserIfCreate(client.getPlayerUid());
            var price = item.getPrice();
            if (user.getMoney() - price >= 0) {
                var owner = item.getOwner();
                var it = item.getItem();
                user.addMoney(-price);
                owner.addMoney(price);
                new PlayerActor(user.getPlayerUid()).addItemToInventory(it.id, it.count, it.data, it.extra || null, true);
                var owner_client = Network.getClientForPlayer(owner.getPlayerUid());
                owner_client && message(owner_client, "Your product has been successfully purchased");
                alert_message(client, "You have successfully purchased");
                this.server_list.remove(item.getUUID());
                Daily.handleBuy(client.getPlayerUid(), item);
                this.container.closeFor(client);
                this.open(client.getPlayerUid(), client);
                return;
            }
        }
        catch (e) {
            alert_message(client, String(e));
        }
        ;
        item.unlock();
    };
    Auction.prototype.addItem = function (client, playerUid, slot, price) {
        if (typeof slot != "number" || typeof price != "number")
            return;
        var user = UsersStorage.getUserIfCreate(playerUid);
        var actor = new PlayerActor(playerUid);
        var item = actor.getInventorySlot(slot);
        if (item.id != 0 && item.count > 0 && price >= 0 && user.canPermission(Permission.USE_AUCTION) && user.canPermission(Permission.ADDED_ITEM_FOR_AUCTION)) {
            actor.setInventorySlot(slot, 0, 0, 0, null);
            var server_item = new ServerItemAuction(item, price, user);
            this.server_list.add(server_item);
            Daily.handleAddItemAuction(playerUid, server_item);
            this.container.closeFor(client);
            this.open(playerUid, client);
        }
    };
    Auction.prototype.addClientItemAuction = function (item) {
        this.list_builder.addItemAuction(item);
        return this;
    };
    Auction.getExitFunc = function (func) {
        return function (dialog) {
            func(dialog);
        };
    };
    Auction.prototype.addTab = function (group, backgroundLocation, left, name, bitmap1, bitmap2, y, onClick, onLongClick) {
        if (onClick === void 0) { onClick = function () { }; }
        if (onLongClick === void 0) { onLongClick = function () { }; }
        var x = backgroundLocation.x + backgroundLocation.width - TAB_OFFSET;
        if (left)
            x = backgroundLocation.x - SIZE_TAB + TAB_OFFSET + 1;
        var bitmap = UI.TextureSource.get(bitmap1);
        var width = bitmap.getWidth();
        var height = bitmap.getHeight();
        var scale = (1000 - 500) / width;
        var HEIGHT = 500;
        var location = new UI.WindowLocation({
            x: x,
            y: backgroundLocation.y + y,
            height: SIZE_TAB,
            width: SIZE_TAB
        });
        var drawingTab = [
            { type: "color", color: android.graphics.Color.argb(0, 0, 0, 0) },
            { type: "frame", x: 0, y: 0, width: 1000, height: location.globalToWindow(location.height), bitmap: FRAME_TEXTURE, scale: TAB_FRAME_SCALE },
        ];
        group.addWindow("tab_" + name, {
            location: location.asScriptable(),
            drawing: drawingTab,
            elements: {
                "button": {
                    type: "button",
                    x: 500 - width * scale / 2, y: HEIGHT - height * scale / 2,
                    bitmap: bitmap1,
                    bitmap2: bitmap2,
                    scale: scale,
                    clicker: {
                        onClick: onClick,
                        onLongClick: onLongClick
                    }
                }
            }
        });
    };
    Auction.prototype.buildUI = function (screen_name, container) {
        var _this = this;
        var json = JSON.parse(screen_name);
        var clientUser = ClientUser.fromJSON(json.user);
        this.list_builder.setItems(json.items);
        var group = new UI.WindowGroup();
        var height_size = this.list_builder.updateSize(FRAME_OFFSET);
        var slots = this.list_builder.getCountslots() * this.list_builder.getLineSlots();
        var offset_list = 0;
        var width_size = height_size / this.list_builder.getCountslots() * this.list_builder.getLineSlots();
        var backgroundLocation = new UI.WindowLocation({
            x: 500 - width_size / 2 - FRAME_OFFSET,
            y: Y_OFFSET,
            width: width_size + FRAME_OFFSET * 2,
            height: height_size + FRAME_OFFSET * 2,
        });
        group.setCloseOnBackPressed(true);
        var drawing = [
            { type: "color", color: android.graphics.Color.argb(0, 0, 0, 0) },
            { type: "frame", x: 0, y: 0, bitmap: FRAME_TEXTURE, width: 1000, height: backgroundLocation.globalToWindow(backgroundLocation.height), scale: MAIN_FRAME_SCALE }
        ];
        var background = new UI.Window({
            drawing: drawing,
            location: backgroundLocation.asScriptable(),
            elements: {}
        });
        var items_list = new UI.Window();
        this.list_builder.buidlUi(items_list, Y_OFFSET + FRAME_OFFSET, clientUser, offset_list);
        var self = this;
        function updateWindow() {
            self.list_builder.buidlUi(items_list, Y_OFFSET + FRAME_OFFSET, clientUser, offset_list);
            items_list.forceRefresh();
        }
        this.addTab(group, backgroundLocation, false, "exit", BUTTON_EXIT_TEXTURE, BUTTON_EXIT_TEXTURE, 0, function () { return group.close(); }, function () { return group.close(); });
        this.addTab(group, backgroundLocation, true, "info", "info", "info_gray", 0, function () {
            var dialog = PopupWindow.newDefaultStyle("Daily quests");
            dialog.add(new Setting.SettingTextElement(translate("Your money: %v", [clientUser.getMoney()])));
            Daily.fromJSON(json.daily, dialog).openCenter();
        });
        this.addTab(group, backgroundLocation, true, "left", LEFT_TEXTURE + "_0", LEFT_TEXTURE + "_1", backgroundLocation.height - SIZE_TAB, function () {
            if (offset_list >= slots) {
                offset_list -= slots;
                updateWindow();
            }
        });
        this.addTab(group, backgroundLocation, false, "right", RIGHT_TEXTURE + "_0", RIGHT_TEXTURE + "_1", backgroundLocation.height - SIZE_TAB, function () {
            if (offset_list < _this.list_builder.getCountItems()) {
                offset_list += slots;
                updateWindow();
            }
        });
        if (clientUser.canAddedAuctionItem()) {
            var self_1 = this;
            this.addTab(group, backgroundLocation, true, "added_item", ADDED_TEXTURE, ADDED_TEXTURE2, backgroundLocation.height - SIZE_TAB - SIZE_TAB - OFFSET_BETWEEN_TABS, function () {
                group.close();
                var dialog = PopupWindow.newDefaultStyle("Added item");
                dialog.setEnableExitButton(true);
                var item_seleted_element = new SettingInventoryItemSelectedElement("item");
                dialog.add(item_seleted_element);
                dialog.add(new Setting.SettingKeyboardElement("Price", "price"));
                delete dialog.configs.item;
                item_seleted_element.item = undefined;
                dialog.setCloseHandler(function (setting) {
                    var slot = setting.configs.item && setting.configs.item.slot;
                    var price = setting.configs.price;
                    delete setting.configs.item;
                    item_seleted_element.item = undefined;
                    if (typeof slot == "number" && /^\d+$/.test(price)) {
                        price = Number(price);
                        var packet = { slot: slot, price: price };
                        Network.sendToServer("auction." + self_1.name + ".addItem", packet);
                    }
                });
                dialog.openCenter();
            });
        }
        group.addWindowInstance("background", background);
        group.addWindowInstance("items_list", items_list);
        group.getWindow("tab_exit")
            .setBlockingBackground(true);
        return group;
    };
    Auction.prototype.open = function (player, client) {
        if (client === void 0) { client = Network.getClientForPlayer(player); }
        var user = UsersStorage.getUserIfCreate(player);
        user.canPermission(Permission.USE_AUCTION) && this.container.openFor(client, JSON.stringify({
            user: user.toClientJson(),
            items: this.server_list.toSendClient(),
            daily: Daily.toJSON(player)
        }));
    };
    Auction.prototype.setSlotSize = function (size) {
        this.list_builder.setSlotSize(size);
        return this;
    };
    return Auction;
}());
;
var SkyFactoryAction = new Auction("global")
    .setSlotSize(75);
Callback.addCallback("ItemUse", function (coords, item, block, is, player) {
    item.id == VanillaItemID.book && SkyFactoryAction.open(player);
});
Translation.addTranslation("Daily quests", {
    ru: "Ежедневные квесты"
});
Translation.addTranslation("Your money: %v", {
    ru: "Ваши деньги: %v"
});
Translation.addTranslation("Price: %v", {
    ru: "Цена: %v"
});
Translation.addTranslation("Owner: %v", {
    ru: "Владелец: %v"
});
Translation.addTranslation("buy", {
    ru: "Купить"
});
if (__config__.getBool("world_border.enabled")) {
    var radius_1 = __config__.getInteger("world_border.radius");
    var nether_radius_1 = radius_1 * 8;
    function getPos(x, radius) {
        if (x < 0)
            var v = Math.max(x, -radius);
        else
            var v = Math.min(x, radius);
        return v == x ? null : v;
    }
    Callback.addCallback("tick", function () {
        if (World.getThreadTime() % 20 == 0) {
            var players = Network.getConnectedPlayers();
            for (var i in players) {
                var player = players[i];
                var pos = Entity.getPosition(player);
                if (Entity.getDimension(player) == EDimension.NETHER)
                    var x = getPos(pos.x, nether_radius_1), z = getPos(pos.z, nether_radius_1);
                else
                    var x = getPos(pos.x, radius_1), z = getPos(pos.z, radius_1);
                if (x !== null || z !== null) {
                    setPositionPlayer(player, x || pos.x, pos.y, z || pos.z);
                    var client = Network.getClientForPlayer(player);
                    client && message(client, "You have reached the end of the world");
                }
            }
        }
    });
}
var _a;
if (__config__.getBool("daily.enabled")) {
    (function () {
        function getCurrentDay() {
            var date = new Date();
            return {
                month: date.getMonth(),
                day: date.getDate()
            };
        }
        Callback.addCallback("ServerPlayerLoaded", function (player) {
            var days = GlobalSaves.getDataDef("daily", {});
            var name = String(Entity.getNameTag(player));
            var entrance = days[name];
            var currnet = getCurrentDay();
            if (entrance && (entrance.day != currnet.day || entrance.month != currnet.month)) {
                days[name] = currnet;
                Callback.invokeCallback("UpdateEntrance", player, currnet.day, currnet.month, false, true);
            }
            else {
                days[name] = currnet;
                Callback.invokeCallback("UpdateEntrance", player, currnet.day, currnet.month, !entrance, false);
            }
            GlobalSaves.setData("daily", days);
        });
        Callback.addCallback("ServerPlayerTick", function (player) {
            if (World.getThreadTime() % 500) {
                var days = GlobalSaves.getDataDef("daily", {});
                if (days) {
                    days[Entity.getNameTag(player)] = getCurrentDay();
                    GlobalSaves.setData("daily", days);
                }
            }
        });
    })();
    var startMoney_1 = Number(__config__.getInteger("daily.startMoney"));
    var daily_reward_1 = Number(__config__.getInteger("daily.daily_reward"));
    Callback.addCallback("UpdateEntrance", function (player, day, month, first, aboba) {
        var user = UsersStorage.getUserIfCreate(player);
        if (first)
            user.setMoney(startMoney_1);
        else if (!aboba)
            user.addMoney(daily_reward_1);
    });
}
var quests_count = __config__.getInteger("daily.quests_count");
var DailyQuest = /** @class */ (function () {
    function DailyQuest(money, description) {
        this.status = false;
        this.money = money;
        this.description = description;
    }
    DailyQuest.prototype.getDescription = function () {
        return this.description;
    };
    DailyQuest.prototype.getValues = function () {
        return [];
    };
    DailyQuest.prototype.handleBuy = function (playerUid, item) {
    };
    DailyQuest.prototype.handleAddItemAuction = function (player, item) {
    };
    DailyQuest.prototype.handleDestroyBlock = function (player, coords, block) {
    };
    DailyQuest.prototype.handleRecipe = function (player, result) {
    };
    DailyQuest.prototype.clone = function () {
        return this;
    };
    DailyQuest.prototype.getIcon = function () {
        return { id: 0, count: 0, data: 0 };
    };
    DailyQuest.prototype.completed = function (player) {
        this.status = true;
        AchievementAPI.give(player, "Daily quests", this.getDescription(), this.getIcon());
        UsersStorage.getUserIfCreate(player)
            .addMoney(this.money);
    };
    DailyQuest.prototype.canCompleted = function () {
        return this.status;
    };
    return DailyQuest;
}());
var Daily = /** @class */ (function () {
    function Daily() {
    }
    Daily.getPlayerQuests = function (player) {
        var quests = Daily.quests[player];
        if (!quests)
            quests = this.updateQuests(player);
        return quests;
    };
    Daily.handleBuy = function (player, item) {
        var quests = this.getPlayerQuests(player);
        for (var i in quests) {
            var quest = quests[i];
            !quest.canCompleted() && quests[i].handleBuy(player, item);
        }
    };
    Daily.handleAddItemAuction = function (player, item) {
        var quests = this.getPlayerQuests(player);
        for (var i in quests) {
            var quest = quests[i];
            !quest.canCompleted() && quests[i].handleAddItemAuction(player, item);
        }
    };
    Daily.handleDestroyBlock = function (player, coords, block) {
        var quests = this.getPlayerQuests(player);
        for (var i in quests) {
            var quest = quests[i];
            !quest.canCompleted() && quests[i].handleDestroyBlock(player, coords, block);
        }
    };
    Daily.handleRecipe = function (player, result) {
        var quests = this.getPlayerQuests(player);
        for (var i in quests) {
            var quest = quests[i];
            !quest.canCompleted() && quest.handleRecipe(player, result);
        }
    };
    Daily.updateQuests = function (player) {
        var quests = [];
        var random = new java.util.Random();
        for (var i = 0; i < quests_count; i++)
            quests.push(this.list_quests[random.nextInt(this.list_quests.length)].clone());
        Daily.quests[player] = quests;
        return quests;
    };
    Daily.registerQuest = function (quest) {
        this.list_quests.push(quest);
    };
    Daily.toJSON = function (player) {
        var quests = [];
        var userquets = this.getPlayerQuests(player);
        for (var i in userquets) {
            var quest = userquets[i];
            quests.push({ description: quest.getDescription(), values: quest.getValues(), completed: quest.canCompleted() });
        }
        return { quests: quests };
    };
    Daily.fromJSON = function (json, dialog) {
        for (var i in json.quests) {
            var quest = json.quests[i];
            if (!quest.completed)
                dialog.add(new Setting.SettingTextElement(translate(quest.description, quest.values)));
        }
        return dialog;
    };
    Daily.quests = {};
    Daily.list_quests = [];
    (function () {
        Callback.addCallback("DestroyBlock", function (coords, block, player) { return Daily.handleDestroyBlock(player, coords, block); });
        Callback.addCallback("VanillaWorkbenchPostCraft", function (result, container, player) { return Daily.handleRecipe(player, result); });
        Callback.addCallback("UpdateEntrance", function (player, day, month, first, not_entered_today) { return !not_entered_today && Daily.updateQuests(player); });
    })();
    return Daily;
}());
Translation.addTranslation("Break %v/%v %v, reward %v", {
    ru: "Слоамайте %v/%v %v, награда %v"
});
var DestroyBlocksQuest = /** @class */ (function (_super) {
    __extends(DestroyBlocksQuest, _super);
    function DestroyBlocksQuest(block, count, money) {
        var _this = _super.call(this, money, "Break %v/%v %v, reward %v") || this;
        _this.current = 0;
        _this.block = block;
        _this.count = count;
        _this.money = money;
        return _this;
    }
    DestroyBlocksQuest.prototype.handleDestroyBlock = function (player, coords, block) {
        if (block.id == this.block.id && block.data == this.block.data) {
            this.current++;
            this.current >= this.count && this.completed(player);
        }
    };
    DestroyBlocksQuest.prototype.getValues = function () {
        return [this.current, this.count, getName(this.block.id, this.block.data), this.money];
    };
    DestroyBlocksQuest.prototype.getIcon = function () {
        return {
            id: this.block.id,
            count: 1,
            data: this.block.data
        };
    };
    DestroyBlocksQuest.prototype.clone = function () {
        return new _a(this.block, this.count, this.money);
    };
    DestroyBlocksQuest.add = function (block, counts, money) {
        for (var i in counts)
            Daily.registerQuest(new _a(block, counts[i], money));
    };
    return DestroyBlocksQuest;
}(DailyQuest));
_a = DestroyBlocksQuest;
(function () {
    var datas = [0, 1, 3, 5];
    for (var i in datas)
        Daily.registerQuest(new _a({ id: VanillaBlockID.stone, data: datas[i] }, 64, 10));
    var counts = [16, 32];
    _a.add({ id: VanillaBlockID.dirt, data: 0 }, counts, 10);
    _a.add({ id: VanillaBlockID.iron_ore, data: 0 }, counts, 10);
    _a.add({ id: VanillaBlockID.gold_ore, data: 0 }, counts, 10);
    _a.add({ id: VanillaBlockID.coal_ore, data: 0 }, counts, 10);
})();
Translation.addTranslation("Buy in auction %v/%v, reward %v", {
    ru: "Купите на аукционе %v/%v, награда %v"
});
var BuyAuctionQuest = /** @class */ (function (_super) {
    __extends(BuyAuctionQuest, _super);
    function BuyAuctionQuest(count, money) {
        if (count === void 0) { count = 1; }
        var _this = _super.call(this, money, "Buy in auction %v/%v, reward %v") || this;
        _this.current = 0;
        _this.item = { id: 0, count: 0, data: 0 };
        _this.count = count;
        return _this;
    }
    BuyAuctionQuest.prototype.getValues = function () {
        return [this.current, this.count, this.money];
    };
    BuyAuctionQuest.prototype.getIcon = function () {
        return this.item;
    };
    BuyAuctionQuest.prototype.clone = function () {
        return new BuyAuctionQuest(this.count, this.money);
    };
    BuyAuctionQuest.prototype.handleBuy = function (playerUid, item) {
        this.item = item.getItem();
        this.current++;
        if (this.current >= this.count && String(Entity.getNameTag(playerUid)) != String(item.getOwner().getUserName()))
            this.completed(playerUid);
    };
    return BuyAuctionQuest;
}(DailyQuest));
(function () {
    Daily.registerQuest(new BuyAuctionQuest(1, 30));
    Daily.registerQuest(new BuyAuctionQuest(2, 50));
    Daily.registerQuest(new BuyAuctionQuest(2, 80));
    Daily.registerQuest(new BuyAuctionQuest(3, 300));
})();
Translation.addTranslation("Added item in auction %v/%v, reward %v", {
    ru: "Добавьте предметов на аукцион %v/%v, награда %v"
});
var AddItemAuctionQuest = /** @class */ (function (_super) {
    __extends(AddItemAuctionQuest, _super);
    function AddItemAuctionQuest(count, money) {
        if (count === void 0) { count = 1; }
        var _this = _super.call(this, money, "Added item in auction %v/%v, reward %v") || this;
        _this.current = 0;
        _this.item = { id: 0, count: 0, data: 0 };
        _this.count = count;
        return _this;
    }
    AddItemAuctionQuest.prototype.getIcon = function () {
        return this.item;
    };
    AddItemAuctionQuest.prototype.getValues = function () {
        return [this.current, this.count, this.money];
    };
    AddItemAuctionQuest.prototype.clone = function () {
        return new AddItemAuctionQuest(this.count, this.money);
    };
    AddItemAuctionQuest.prototype.handleAddItemAuction = function (playerUid, item) {
        this.item = item.getItem();
        this.current++;
        if (this.current >= this.count)
            this.completed(playerUid);
    };
    return AddItemAuctionQuest;
}(DailyQuest));
(function () {
    Daily.registerQuest(new AddItemAuctionQuest(4, 40));
    Daily.registerQuest(new AddItemAuctionQuest(1, 3));
    Daily.registerQuest(new AddItemAuctionQuest(3, 10));
    Daily.registerQuest(new AddItemAuctionQuest(2, 15));
    Daily.registerQuest(new AddItemAuctionQuest(6, 80));
})();
Translation.addTranslation("Craft %v %v/%v, reward %v", {
    ru: "Скрафтите %v %v/%v, нагада %v"
});
Translation.addTranslation("Use the %v/%v workbench, %v reward", {
    ru: "Воспользуйтесь верстаком %v/%v, награда %v"
});
var RecipeDailyQuest = /** @class */ (function (_super) {
    __extends(RecipeDailyQuest, _super);
    function RecipeDailyQuest(item_craft, count, money) {
        var _this = _super.call(this, money, item_craft != -1 ? "Craft %v %v/%v, reward %v" : "Use the %v/%v workbench, %v reward") || this;
        _this.current = 0;
        _this.item = { id: 0, count: 0, data: 0 };
        _this.count = count;
        _this.item_craft = item_craft;
        return _this;
    }
    RecipeDailyQuest.prototype.getValues = function () {
        if (this.item_craft != -1)
            return [getName(this.item_craft, 0), this.current, this.count, this.money];
        return [this.current, this.count, this.money];
    };
    RecipeDailyQuest.prototype.getIcon = function () {
        return this.item;
    };
    RecipeDailyQuest.prototype.clone = function () {
        return new RecipeDailyQuest(this.item_craft, this.count, this.money);
    };
    RecipeDailyQuest.prototype.handleRecipe = function (player, result) {
        this.item = result;
        if (this.item_craft != -1) {
            if (this.item_craft == result.id) {
                this.current += result.count;
            }
        }
        else
            this.count++;
        if (this.current >= this.count)
            this.completed(player);
    };
    return RecipeDailyQuest;
}(DailyQuest));
(function () {
    Daily.registerQuest(new RecipeDailyQuest(VanillaBlockID.planks, 32, 10));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_helmet, 1, 10));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_chestplate, 1, 10));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_leggings, 1, 10));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.iron_boots, 1, 10));
    Daily.registerQuest(new RecipeDailyQuest(VanillaBlockID.glowstone, 5, 35));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.bread, 16, 32));
    Daily.registerQuest(new RecipeDailyQuest(VanillaItemID.bucket, 1, 16));
    Daily.registerQuest(new RecipeDailyQuest(-1, 64, 50));
    Daily.registerQuest(new RecipeDailyQuest(-1, 16, 10));
})();
var Lock = /** @class */ (function () {
    function Lock() {
    }
    Lock.prototype.lock = function () {
        this.lock_status = true;
    };
    Lock.prototype.unlock = function () {
        this.lock_status = false;
    };
    Lock.prototype.canlock = function () {
        return this.lock_status;
    };
    return Lock;
}());
var ListActions = /** @class */ (function () {
    function ListActions() {
    }
    return ListActions;
}());
var SubChunk = /** @class */ (function (_super) {
    __extends(SubChunk, _super);
    function SubChunk(minY, maxY) {
        var _this = _super.call(this) || this;
        _this.actions = {};
        _this.minY = minY;
        _this.maxY = maxY;
        return _this;
    }
    SubChunk.prototype.addBreak = function (x, y, z) {
    };
    return SubChunk;
}(Lock));
var COUNT_BLOCKS_CHUNK = 32;
var COUNT_SUB_CHUNK = 256 / COUNT_BLOCKS_CHUNK;
var ChunkBlockTrack = /** @class */ (function (_super) {
    __extends(ChunkBlockTrack, _super);
    function ChunkBlockTrack(chunkX, chunkZ) {
        var _this = _super.call(this) || this;
        _this.sub_chunks = [];
        _this.chunkX = chunkX;
        _this.chunkZ = chunkZ;
        for (var y = 0; y < COUNT_SUB_CHUNK; y++)
            _this.sub_chunks.push(new SubChunk(y * COUNT_BLOCKS_CHUNK, (y + 1) * COUNT_BLOCKS_CHUNK));
        return _this;
    }
    return ChunkBlockTrack;
}(Lock));
var BlockTrack = /** @class */ (function () {
    function BlockTrack() {
    }
    BlockTrack.saveChunk = function (chunkX, chunkZ) {
    };
    BlockTrack.chunks = [];
    (function () {
        Callback.addCallback("LevelSelected", function (worldName, worldDir) {
        });
        Callback.addCallback("LevelLeft", function () {
        });
    })();
    return BlockTrack;
}());
ModAPI.registerAPI("ServerUtils", {
    CommandRegistry: CommandRegistry,
    Command: Command,
    CommandArgType: CommandArgType,
    CommandUtils: CommandUtils,
    Permission: Permission,
    UsersStorage: UsersStorage,
    Auction: Auction,
    DailyQuest: DailyQuest,
    Daily: Daily,
    GlobalSaves: GlobalSaves,
    PopupWindow: PopupWindow,
    EnumHelp: EnumHelp,
    requireGlobal: function (cmd) {
        return eval(cmd);
    }
});
