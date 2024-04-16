function forEachEnum(anum_: any, func: (name: string, value: number) => void): void {
    for(let key in anum_)
        if(!/^\d+$/.test(key))
            func(key, anum_[key]);
}

type PacketMessagePlayer = {
    message: string;
    values: any[][]
};

function translate(text: string, values: any[]){
    let message = Translation.translate(text);
    
    if(values){
        for(let i in values)
            message = message.replace("%v", values[i]);
    }

    return message;
}

function getName(id: number, data: number): string {
    return Translation.translate(Item.getName(id, data));
}

function getMessage(packet: PacketMessagePlayer): string {
    if(packet.values)
        return translate(packet.message, packet.values[0])
    return translate(packet.message, []);
}

Network.addClientPacket("server_utils.message_player", (packet: PacketMessagePlayer) => {
    Game.message(getMessage(packet));
});

Network.addClientPacket("server_utils.alert_player", (packet: PacketMessagePlayer) => {
    alert(getMessage(packet));
});

function message(client: NetworkClient, message: string, ...values: any[]){
    let packet: PacketMessagePlayer = {message, values};
    client.send("server_utils.message_player", packet);
}

function alert_message(client: NetworkClient, message: string, ...values: any[]){
    let packet: PacketMessagePlayer = {message, values};
    client.send("server_utils.alert_player", packet);
}

type PacketSetPlayerPosition = {
    x: number,
    y: number,
    z: number
}

Network.addClientPacket("server_utils.setPositionPlayer", (packet: PacketSetPlayerPosition) => {
    Player.setPosition(packet.x, packet.y, packet.z);
});

function setPositionPlayer(player: number, x: number, y: number, z: number): void {
    Entity.setPosition(player, x, y, z);
    let client = Network.getClientForPlayer(player);
    let packet: PacketSetPlayerPosition = {x, y, z};
    client && client.send("server_utils.setPositionPlayer", packet);
}

class EnumHelp {
    protected value: number;
    protected enum_obj: unknown;
    protected posts: string[] = [];

    constructor(enum_obj: unknown){
        let self = this;
        forEachEnum(enum_obj, (name, value) => name != "MAX_VALUE"?  self.value = Math.max(self.value, value) : 0);
        this.enum_obj = enum_obj;
    }

    public add(name: string): void {
        this.enum_obj[this.enum_obj[name] = this.value] = name;
        this.value++;
        this.enum_obj[this.enum_obj["MAX_VALUE"] = this.value] = "MAX_VALUE";

        let value = ++this.value;

        for(let i in this.posts){
            let name = this.posts[i];
            this.enum_obj[this.enum_obj[name] = value] = name;
            value++;
        }

    }

    public addPost(name: string): void {
        this.posts.push(name);
    }

    public get(name: string): number {
        return this.enum_obj[name];
    }
}
