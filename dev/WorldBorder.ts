
if(__config__.getBool("world_border.enabled")){
    const radius = __config__.getInteger("world_border.radius");
    const nether_radius = radius * 8;

    function getPos(x: number, radius: number): number {
        if(x < 0) var v = Math.max(x, -radius);
        else var v = Math.min(x, radius);

        return v == x ? null : v;
    }

    Callback.addCallback("tick", () => {
        if(World.getThreadTime() % 20 == 0){
            let players = Network.getConnectedPlayers();

            for(let i in players){
                let player = players[i];
                let pos = Entity.getPosition(player);

                if(Entity.getDimension(player) == EDimension.NETHER)
                    var x = getPos(pos.x, nether_radius), z = getPos(pos.z, nether_radius);
                else
                    var x = getPos(pos.x, radius), z = getPos(pos.z, radius);

                if(x !== null || z !== null){
                    setPositionPlayer(player, x || pos.x, pos.y, z || pos.z);
                    let client = Network.getClientForPlayer(player);
                    client && message(client, "You have reached the end of the world");
                }
                
            }
        }
    });
}