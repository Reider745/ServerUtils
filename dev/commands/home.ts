type HomePoint = {
    x: number,
    y: number,
    z: number,
    d: number
}

class CommandSetHome extends Command {
    constructor(){
        super([]);
        this.setPermissionUseCommand(Permission.CREATE_HOME);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        let playerUid = client.getPlayerUid();
        let pos = Entity.getPosition(playerUid);

        UsersStorage.getUserIfCreate(playerUid)
            .setData<HomePoint>("home", {
                x: pos.x,
                y: pos.y, 
                z: pos.z,
                d: Entity.getDimension(playerUid)
            });

        this.message(client, "Create home, pos %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
        return true;
    }
}

class CommandHome extends Command {
    constructor(){
        super([]);
        this.setPermissionUseCommand(Permission.USE_HOME);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        let playerUid = client.getPlayerUid();

        let point: HomePoint = UsersStorage.getUserIfCreate(playerUid).getData("home");
        if(point){
            let pos = Entity.getPosition(playerUid);

            setPositionPlayer(playerUid, point.x, point.y, point.z);
            Dimensions.transfer(playerUid, point.d);
            
            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));

            return true;
        }
        
        return false;
    }
}

CommandRegistry.registry("sethome", new CommandSetHome());
CommandRegistry.registry("home", new CommandHome());