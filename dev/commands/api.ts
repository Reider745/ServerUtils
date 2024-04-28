class CommandUtils {
    public static getPlayerByName(name: string): number {
        let players = Network.getConnectedPlayers();
        for(let i in players){
            let player = players[i];
            if(String(Entity.getNameTag(player)) == name)
                return player;
        }
        return null;
    }
}

enum CommandArgType {
    NUMBER,
    STRING,
    PLAYER,
    BOOLEAN,
    ENUM
}

class Command {
    protected args_types: CommandArgType[];//по умолчанию
    protected commandsArgsTypes: CommandArgType[][] = [];

    public enum_local: object;
    protected permission: Permission = Permission.MAX_VALUE;

    constructor(args_types: CommandArgType[], enum_local?: object){
        this.args_types = args_types;
        this.enum_local = enum_local;
    }

    protected addArgsTypes(types: CommandArgType[]): void {
        this.commandsArgsTypes.push(types);
    }

    protected setPermissionUseCommand(permission: Permission): void {
        this.permission = permission;
    }

    public getArgsTypes(): CommandArgType[] {
        return this.args_types;
    }

    public splitCommand(command: string): string[] {
        let args = [""];
        let str = false;

        for(let i = 0;i < command.length;i++){
            let symbol = command.charAt(i);

            if(symbol == " " && !str)
                args.push("");

            if(symbol == "\"" || symbol == "'"){
                str = !str;
                continue;
            }

            if(symbol != " " || str)
                args[args.length - 1] += symbol;
        }
        args.shift();
        return args;
    }

    public parseArguments(client: NetworkClient, raw_args: string[], args_types?: CommandArgType[]): any[] {
        if(!args_types){
            if(this.args_types.length == raw_args.length) args_types = this.args_types;
            else
                for(let i in this.commandsArgsTypes){
                    let types = this.commandsArgsTypes[i];
                    if(types.length == raw_args.length){
                        args_types = types;
                        break;
                    }
                }
        }

        if(!args_types || args_types.length != raw_args.length){
            this.message(client, "Error parse arguments length args_types != raw_arfs");
            return null;
        }
        let args = [];

        for(let i in raw_args){
            let arg = raw_args[i];
            switch(args_types[i]){
                case CommandArgType.NUMBER:
                    args.push(Number(arg));
                    break;
                case CommandArgType.STRING:
                    args.push(arg);
                    break;
                case CommandArgType.PLAYER:
                    if(arg == "@s")
                        args.push(client ? client.getPlayerUid() : Player.get());
                    else{
                        let playerUid = CommandUtils.getPlayerByName(arg);
                        if(!playerUid){
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
                    let value = this.enum_local[arg.toUpperCase()];
                    if(typeof value == "string")
                        args.push(Number(value));
                    else if(value === undefined){
                        this.message(client, "Error parse arguments, not found enum %v", arg.toUpperCase()+"\n"+JSON.stringify(this.enum_local));
                        return null;
                    }
                    args.push(value);
                    break;
            }
        }

        return args;
    }

    public canUseCommnad(player: number): boolean {
        if(this.permission != Permission.MAX_VALUE && UsersStorage.getUserIfCreate(player).canPermission(this.permission))
            return true;
        return new PlayerActor(player).isOperator();
    }

    public message(client: NetworkClient, text: string,  ...values: any[]): void {
        if(!client){
            Game.message(getMessage({message: text, values: values}));
            return;
        }
        message(client, text, values);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        return true;
    }

    public runClient(raw_args: any[]): boolean {
        return true;
    }
}

type PacketUseCommand = {
    raw_args: string[];
}

class CommandGetAccess extends Command {
    private commands: {[command: string]: Command};

    constructor(commands: {[command: string]: Command}){
        super([]);
        this.commands = commands;
        this.setPermissionUseCommand(Permission.ACCESS_COMMAND);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        let msg = "====Access Command====";

        let playerUid = client.getPlayerUid();

        for(let name in this.commands){
            let command = this.commands[name];

            if(command.canUseCommnad(playerUid)){
                let args_types = command.getArgsTypes();
                let args_m = ""
                for(let i in args_types){
                    switch(args_types[i]){
                        case CommandArgType.NUMBER:
                            args_m += "number ";
                            break;
                        case CommandArgType.STRING:
                            args_m += "string ";
                            break;
                        case CommandArgType.PLAYER:
                            args_m += "player ";
                            break;
                        case CommandArgType.BOOLEAN:
                            args_m += "boolean ";
                            break;
                        case CommandArgType.ENUM:
                            forEachEnum(command.enum_local, (name, value) => args_m += name+"/")
                            args_m += "";
                            break;
                    }
                    
                }
                msg += "\n"+name;
            }
        }

        this.message(client, msg);

        return true;
    }
}

class CommandRegistry {
    private static commands: {[command: string]: Command} = {};

    private static runServer(command: Command, client: NetworkClient, packet: PacketUseCommand){
        if(packet.raw_args && command.canUseCommnad(client.getPlayerUid())){
            let args = command.parseArguments(client, packet.raw_args);
            if(args && !command.runServer(client, args)){
                command.message(client, "Error run command");
                return false;
            } 
            return true;
        }else
            command.message(client, "Not permission use command");
        return false;
    }

    public static registry(name: string, command: Command): void {
        this.commands["/"+name] = command;

        Network.addServerPacket("server_utils.command.use_command."+name, (client, packet: PacketUseCommand) => 
            CommandRegistry.runServer(command, client, packet));
    }

     

    static {
        let cmd = new CommandGetAccess(CommandRegistry.commands);
        CommandRegistry.registry("access", cmd);
        CommandRegistry.registry("h", cmd);

        Callback.addCallback("NativeCommand", function(cmd) {
            const name = cmd.split(" ")[0];
            const command = CommandRegistry.commands[name];
            if(command){
                const raw_args = command.splitCommand(cmd);

                const packet: PacketUseCommand = {raw_args};
                const args = command.parseArguments(null, raw_args);
                
                if(args && command.runClient(args)){
                    Network.sendToServer("server_utils.command.use_command."+name.replace("/", ""), packet);
                    Game.prevent();
                } 
            }
        });
    }

    public static runServerCommandForPlayer(client: NetworkClient, cmd: string): boolean{
        const command = CommandRegistry.commands[cmd.split(" ")[0]];
        if(command){
            const raw_args = command.splitCommand(cmd);
            const packet: PacketUseCommand = {raw_args};

            return CommandRegistry.runServer(command, client, packet);
        }
        return false;
    }
}
//example
/*
class TestCommand extends Command {
    constructor(){
        super([]);
    }

    public runServer(client: NetworkClient, args: any[]): boolean {
        return CommandRegistry.runServerCommandForPlayer(client, "/rt 'Жопа негра' 16",);
    }
}

CommandRegistry.registry("test", new TestCommand());
*/