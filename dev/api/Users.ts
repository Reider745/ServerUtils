enum Permission {
    USE_AUCTION, 
    ADDED_ITEM_FOR_AUCTION,

    CONTROL_MONEY,
    CONTROL_PERMISSION,

    CREATE_HOME,
    CREATE_WARP,

    USE_HOME,
    USE_WARP,
    REMOVE_WARP,
    REMOVE_WARP_NOT_OWNER,

    SPAWN_COMMAND,

    ACCESS_COMMAND,

    WORLD_RENDER_TEXT_COMMAND,

    AUCTION_COMMAND,

    MAX_VALUE
};


class PermissionStorage {
    private permissions: number[] = [];

    constructor(permissions: number[]){
        if(permissions){
            for(let i = 0;i < permissions.length;i++)
                this.permissions[i] = permissions[i];

            if(Permission.MAX_VALUE != permissions.length)
                for(let i = permissions.length;i < Permission.MAX_VALUE;i++)
                    this.permissions[i] = 0;
        }else
            for(let i = 0;i < Permission.MAX_VALUE;i++)
                this.permissions[i] = 0;
    }

    public setPermission(permission: Permission, value: number = 1): void {
        this.permissions[permission] = value;
    }

    public canPermission(permission: Permission): boolean {
        return !!this.permissions[permission];
    }

    public getPermissions(): number[] {
        return this.permissions;
    }
}

interface UserJson {
    user_name: string;
    money: number;
}

class User {
    private user_name: string;
    protected many: number;

    constructor(name: string, many: number){
        this.user_name = String(name);
        this.many = many;
    }

    public getUserName(): string {
        return this.user_name;
    }

    public getMoney(): number {
        return this.many;
    }

    public setMoney(many: number): void {
        this.many = many;
    }

    public addMoney(many: number): void {
        this.setMoney(this.getMoney() + many);
    }

    public toJson(): UserJson {
        return {
            user_name: this.getUserName(),
            money: this.getMoney()
        }
    }

    public getPlayerUid(): number {
        return -1;
    }

    public message(str: string, ...values: any[]): void {
        Game.message(translate(str, values));
    }
};

interface ClientUserJson extends UserJson  {
    addedAuctionItem: boolean;
    mark_up_auction_added_item: number;
    ransom_auction_added_item: number;
}

class ClientUser extends User {
    private readonly addedAuctionItem: boolean;
    private readonly mark_up_auction_added_item: number;
    private readonly ransom_auction_added_item: number;

    constructor(user_name: string, addedAuctionItem: boolean, many: number, mark_up_auction_added_item: number, ransom_auction_added_item: number){
        super(user_name, many);

        this.addedAuctionItem = addedAuctionItem;
        this.mark_up_auction_added_item = mark_up_auction_added_item;
        this.ransom_auction_added_item = ransom_auction_added_item;
    }

    public canAddedAuctionItem(): boolean {
        return this.addedAuctionItem;
    }

    public getMarkUpAuctionAddedItem(): number {
        return this.mark_up_auction_added_item;
    }

    public getRansomAuctionAddedItem(): number {
        return this.ransom_auction_added_item;
    }

    public getPlayerUid(): number {
        return Player.get();
    }

    public static fromJSON(json: ClientUserJson): ClientUser {
        return new ClientUser(json.user_name, json.addedAuctionItem, json.money, json.mark_up_auction_added_item, json.ransom_auction_added_item);
    }
}

interface ServerUserJson extends UserJson {
    playerUid: number;
    permissions: number[];
    addional: {[key: string]: any};

    current_priviege?: string;
}

let GLOBAL_PERMISSION: PermissionStorage = (() => {
    let permissions = new PermissionStorage([]);

    forEachEnum(Permission, (name, value) => permissions.setPermission(value, Number(__config__.get("global_permission."+name))));  
    
    return permissions;
})();

class ServerUser extends User {
    private playerUid: number;
    private permissions: PermissionStorage;
    private current_priviege: Priviliege;

    private addional: {[key: string]: any} = {};

    constructor(playerUid: number, name: string, addional: {[key: string]: any} = {}, permissions?: number[], many: number = 0, current_priviege: string = undefined){
        super(name, many);

        this.playerUid = playerUid;
        this.addional = addional;
        this.permissions = new PermissionStorage(permissions);

        this.setPriviege(current_priviege);
    }

    public setPriviege(id: Nullable<string>): void {
        if(id)
            this.current_priviege = Priviliege.get(id);
        else
            this.current_priviege = Priviliege.get(Priviliege.DEF)
    }

    public getPlayerUid(): number {
        return this.playerUid;
    }

    public message(str: string, ...values: any[]): void {
        let client = Network.getClientForPlayer(this.getPlayerUid());
        client && message(client, str, values);
    }

    public isOperator(): boolean {
        return new PlayerActor(this.playerUid).isOperator();
    }

    public setPermission(permission: Permission, value: number = 1): void {
        this.permissions.setPermission(permission, value);
    }

    public canPermission(permission: Permission): boolean {
        return this.isOperator() || this.current_priviege.canPermission(permission, this) || this.permissions.canPermission(permission) || GLOBAL_PERMISSION.canPermission(permission);
    }

    public getPriviliege(): Priviliege {
        return this.current_priviege;
    }

    public getPriviliegeValue<T>(id: ID_PRIVIEGE_VALUE, def: T): T {
        return this.current_priviege.getValueDef(id, def);
    }

    public getXp(): number {
        return this.getDataDef("xp", 0);
    }

    public setXp(xp: number): void {
        this.setData("xp", xp);
    }

    public addXp(xp: number): void {
        this.setXp(this.getXp()+xp);
    }

    public toClientJson(): ClientUserJson {
        return {
            user_name: this.getUserName(),
            money: this.getMoney(),

            addedAuctionItem: this.canPermission(Permission.ADDED_ITEM_FOR_AUCTION),

            mark_up_auction_added_item: this.getPriviliegeValue("mark_up_auction_added_item", DEF_MARK_ADDED),
            ransom_auction_added_item: this.getPriviliegeValue("ransom_auction_added_item", DEF_RANSOM_ADDED)
        }
    }

    public getData<T>(name: string): Nullable<T> {
        return this.addional[name];
    }

    public getDataDef<T>(name: string, def: T): T {
        return this.getData(name) || def;
    }

    public setData<T>(name: string, data: T): void {
        this.addional[name] = data;
    }

    public toJson(): ServerUserJson {
        let json = super.toJson();
        return {
            user_name: json.user_name,
            money: this.getMoney(),

            playerUid: this.playerUid,
            permissions: this.permissions.getPermissions(),
            addional: this.addional,
            current_priviege: this.current_priviege.getId()
        };
    }

    public static fromJSON(json: ServerUserJson): ServerUser {
        return new ServerUser(json.playerUid, json.user_name, json.addional, json.permissions, json.money, json.current_priviege);
    }

    static {
        Callback.addCallback("QuestGive", (main, isLeft, tab, quest, player, value, is, result) => {
            if(value && result){
                let user = UsersStorage.getUserIfCreate(player);
                user && user.addXp(user.getPriviliegeValue("guest_xp", DEF_XP));
            }
        });
    }
}

type SaveUserStorage = {
    users: {[playerUid: number]: ServerUserJson};
}

namespace UsersStorage {
    let user_storage: {[playerUid: number]: ServerUser} = {};
    let user_storage_nicknames: {[playerUid: string]: ServerUser} = {};

    export function getUserIfCreate(playerUid: number): ServerUser {
        if(playerUid == -1){
            let client = Network.getClientForPlayer(playerUid);
            client && client.disconnect("What?");
            return null;
        }
        let user: ServerUser = user_storage[playerUid];
        if(!user){
            user = new ServerUser(playerUid, Entity.getNameTag(playerUid));
            Logger.Log("Create ServerUser "+user.getUserName(), "ServerUtils");
            return user_storage_nicknames[user.getUserName()] = user_storage[playerUid] = user;
        }
        return user;
    }

    export function canPermission(player: number, permission: Permission): boolean {
        let user = getUserIfCreate(player);
        return user && user.canPermission(permission);
    }

    export function getUserForName(nickname: string): Nullable<ServerUser> {
        let user: ServerUser = user_storage_nicknames[nickname];
        if(!user){
            let player = CommandUtils.getPlayerByName(nickname);
            if(player == null) return null;
            user = UsersStorage.getUserIfCreate(player);
            user_storage_nicknames[user.getUserName()] = user
        }
        return user;
    }

    export function getUsers(): {[playerUid: number]: ServerUser} {
        return user_storage;
    }

    Callback.addCallback("ServerPlayerLoaded", playerUid => getUserIfCreate(playerUid));
    Callback.addCallback("LevelLeft", () => user_storage = {});

    Saver.addSavesScope("server_utils.user_storage", (scope: SaveUserStorage) => {
        let users = scope.users || {};
        let result = {};
        for(let key in users){
            let json = users[key];
            if(json.playerUid == -1 || String(json.user_name) == "")
                continue;
            let user = result[key] = ServerUser.fromJSON(users[key]);
            user_storage_nicknames[user.getUserName()] = user;
        }
        user_storage = result;
    }, function(): SaveUserStorage {
        let users: {[playerUid: number]: ServerUserJson} = {};
        for(let key in user_storage)
            users[key] = user_storage[key].toJson();
        return {users};
    });
}