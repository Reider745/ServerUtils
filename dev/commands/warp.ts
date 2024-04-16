const MAX_WARP_DEF = __config__.getInteger("warp_default_counts");

type ListWarpPoints = {[name: string]: {
    x: number;
    y: number;
    z: number;
    d: number;
    o: string;
}};
type ListPlayerCountWarp = {[name: string]: number};

class CommandSetWarp extends Command {
    constructor(){
        super([CommandArgType.STRING]);
        this.setPermissionUseCommand(Permission.CREATE_WARP);
    }

    public runServer(client: NetworkClient, args: [string]): boolean {
        let warp_playrs: ListPlayerCountWarp = GlobalSaves.getDataDef("warp_players", {});

        let playerUid = client.getPlayerUid();
        let user = UsersStorage.getUserIfCreate(playerUid);
        let user_name = user.getUserName();
        let count = warp_playrs[user_name] || 0
        
        let warps: ListWarpPoints = GlobalSaves.getDataDef("warps", {});

        if(!warps[args[0]] && (user.isOperator() || count < user.getDataDef("warps_count", MAX_WARP_DEF))){
            let pos = Entity.getPosition(playerUid);

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
    }
}

class CommandWarp extends Command {
    constructor(){
        super([CommandArgType.STRING]);
        this.setPermissionUseCommand(Permission.USE_WARP);
    }

    public runServer(client: NetworkClient, args: [string]): boolean {
        let warp = GlobalSaves.getDataDef<ListWarpPoints>("warps", {})[args[0]]; 
        if(warp){
            let playerUid = client.getPlayerUid();

            let pos = Entity.getPosition(playerUid);

            setPositionPlayer(playerUid, warp.x, warp.y, warp.z);
            Dimensions.transfer(playerUid, warp.d);

            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));

            return true;
        }

        this.message(client, "Not found warp %v", args[0]);

        return false;
    }
}

class CommandRemoveWarp extends Command {
    constructor(){
        super([CommandArgType.STRING]);
        this.setPermissionUseCommand(Permission.REMOVE_WARP);
    }

    public runServer(client: NetworkClient, args: [string]): boolean {
        let warps: ListWarpPoints = GlobalSaves.getDataDef("warps", {}); 
        let name = args[0];

        if(!warps[name]){
            let warp_playrs: ListPlayerCountWarp = GlobalSaves.getDataDef("warp_players", {});

            let user = UsersStorage.getUserIfCreate(client.getPlayerUid());
            let owner = warps[name].o;

            if(user.getUserName() != owner && !user.canPermission(Permission.REMOVE_WARP_NOT_OWNER)){
                this.message(client, "You are not the owner of warp %v", args[0]);
                return false;
            }

            try{
                delete warps[name];
                warp_playrs[owner]--;
            }catch(e){
                this.message(client, e);
                warp_playrs[owner] = 0;
            }

            return true;
        }

        this.message(client, "Not found warp %v", args[0]);

        return false;
    }
}

CommandRegistry.registry("setwarp", new CommandSetWarp());
CommandRegistry.registry("warp", new CommandWarp());
CommandRegistry.registry("removewarp", new CommandRemoveWarp());