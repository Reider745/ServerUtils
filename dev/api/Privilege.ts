/**
 * max_auction_added_item - ограничение по количеству добавленных предметов на аукцион(по умочанию 8)
 * markup_auction_added_item(not support) - наценка на выкладывание предмета
 * ransom_auction_added_item(not support) - наценка на выкуп своего предмета
 * afk_time(not support) - максимально разрешенное время в афк
 * radius_world - размер мира
 * guest_xp - опыт за выполнение квеста
 * daily_reward - ежедневная награда
 */
type ID_PRIVIEGE_VALUE = "max_auction_added_item" | "mark_up_auction_added_item" 
    | "ransom_auction_added_item" | "afk_time" | "radius_world" | "guest_xp"
    | "daily_reward";

const DEF_AUCTION_SLOTS = 8;
const DEF_RADIUS_WORLD = 32;
const DEF_XP = 1;
const DEF_MARK_ADDED = 5;
const DEF_RANSOM_ADDED = 5;

class Priviliege {
    protected readonly id: string;
    protected hash_map: {[key: string]: any} = {};

    constructor(id: string){
        this.id = id;
    }

    public getId(): string {
        return this.id;
    }

    public canPermission(permission: Permission, user: ServerUser): boolean {
        return false;
    }

    public getValueDef<T>(id: ID_PRIVIEGE_VALUE, def: T): T {
        let result = this.hash_map[id];
        if(result === undefined)
            return def;
        return result;
    }

    

    private static privilieges: {[id: string]: Priviliege} = {};
    public static DEF: string = "player";

    public static register(clazz: Priviliege): void {
        Priviliege.privilieges[clazz.getId()] = clazz;
    }

    public static get(id: string): Priviliege {
        let result = Priviliege.privilieges[id];
        if(!result)
            return Priviliege.privilieges[Priviliege.DEF];
        return result;
    }

    static {
        Callback.addCallback("AddedPriviliege", (nickname, result, priviliege_name) => {
            Logger.Log("Start added priviliege "+nickname+", "+priviliege_name, "ServerUtils");

            let user = UsersStorage.getUserForName(nickname);
            if(user){
                user.setPriviege(priviliege_name);
                result.set(true);
                
                Logger.Log("Result added priviliege "+nickname+", "+user.getPriviliege().getId(), "ServerUtils");
                return;
            }

            
            Logger.Log("Error added priviliege "+nickname+", "+priviliege_name, "ServerUtils");
        });
    }
}

Translation.addTranslation("%v experience is required to use auctions, you have %v", {
    ru: "Для использования аукционов требуется %v опыта, у вас %v"
});

class PlayerPriviliege extends Priviliege {
    constructor(id: string){
        super(id);
    }

    public canPermission(permission: Permission, user: ServerUser): boolean {
        if(permission == Permission.USE_AUCTION){
            let xp = user.getXp();
            user.message("%v experience is required to use auctions, you have %v", 10, xp);
            return xp > 10;
        }
        return super.canPermission(permission, user);
    }
}

class ZbtPriviliege extends PlayerPriviliege {
    constructor(id: string){
        super(id);

        this.hash_map["auction_slots"] = 10;
        this.hash_map["radius_world"] = DEF_RADIUS_WORLD + 128;
        this.hash_map["daily_reward"] = 1;
        this.hash_map["ransom_auction_added_item"] = 0;
    }

    public canPermission(permission: Permission, user: ServerUser): boolean {
        switch (permission) {
            case Permission.CREATE_HOME:
                return true;

            case Permission.USE_HOME:
                return true;
        }

        return super.canPermission(permission, user);
    }
}
/*
====ЗБТ
- Слотов на аукционе 10
- Радиус мира больше на 128 блока
- Ежедневная награда 1
- Наценка на выкуп 0%
- Права использования home и sethome
*/

class ObtPriviliege extends PlayerPriviliege {
    constructor(id: string){
        super(id);

        this.hash_map["auction_slots"] = 10;
        this.hash_map["radius_world"] = DEF_RADIUS_WORLD + 32;
        this.hash_map["ransom_auction_added_item"] = 0;
    }

    public canPermission(permission: Permission, user: ServerUser): boolean {
        switch (permission) {
            case Permission.CREATE_HOME:
                return true;

            case Permission.USE_HOME:
                return true;
        }

        return super.canPermission(permission, user);
    }
}
/*
====ОБТ
- Слотов на аукционе 10
- Радиус мира больше на 32 блока
- Наценка на выкуп 0%
- Права использования home и sethome
*/

class VipPriviliege extends PlayerPriviliege {
    constructor(id: string){
        super(id);

        this.hash_map["auction_slots"] = 16;
        this.hash_map["radius_world"] = DEF_RADIUS_WORLD + 64;
        this.hash_map["guest_xp"] = 2;
        this.hash_map["daily_reward"] = 5;
        this.hash_map["markup_auction_added_item"] = 0;
        this.hash_map["ransom_auction_added_item"] = 0;
    }

    public canPermission(permission: Permission, user: ServerUser): boolean {
        switch (permission) {
            case Permission.CREATE_HOME:
                return true;

            case Permission.USE_HOME:
                return true;
            
            case Permission.CREATE_WARP:
                return true;

            case Permission.USE_WARP:
                return true;
        }

        return super.canPermission(permission, user);
    }
}

Priviliege.register(new Priviliege(Priviliege.DEF));
Priviliege.register(new VipPriviliege("vip"));
Priviliege.register(new ZbtPriviliege("zbt"));
Priviliege.register(new ObtPriviliege("obt"));