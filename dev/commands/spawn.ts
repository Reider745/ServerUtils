class CommandSetSpawn extends Command {
    constructor(){
        super([]);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        let pos = Entity.getPosition(client.getPlayerUid());
        GlobalSaves.setData("spawn", {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            d: Entity.getDimension(client.getPlayerUid())
        });
        this.message(client, "Successfully set spawn");
        return true;
    }
}

class CommandSpawn extends Command {
    constructor(){
        super([]);
        this.setPermissionUseCommand(Permission.SPAWN_COMMAND);
    }

    public canUseCommnad(player: number): boolean {
        return super.canUseCommnad(player) && !!GlobalSaves.getData("spawn");
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        let spawn: {x: number, y: number, z: number, d: number} = GlobalSaves.getData("spawn");
        if(spawn){
            let playerUid = client.getPlayerUid();
            let pos = Entity.getPosition(playerUid);

            setPositionPlayer(playerUid, spawn.x, spawn.y, spawn.z);
            Dimensions.transfer(playerUid, spawn.d);
            
            this.message(client, "Teleport from %v %v %v", pos.x.toFixed(2), pos.y.toFixed(2), pos.z.toFixed(2));
            return true;
        }
        return false;
    }
}

CommandRegistry.registry("setspawn", new CommandSetSpawn());
CommandRegistry.registry("spawn", new CommandSpawn());

Callback.addCallback("TeleportSpawn", (nickname) => {
    let user = UsersStorage.getUserForName(nickname);
    let spawn: {x: number, y: number, z: number, d: number} = GlobalSaves.getData("spawn");

    if(user && spawn){
        const playerUid = user.getPlayerUid();
        
        setPositionPlayer(playerUid, spawn.x, spawn.y, spawn.z);
        Dimensions.transfer(playerUid, spawn.d);
    }
});