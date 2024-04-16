class CommandPermission extends Command {
    constructor(){
        super([CommandArgType.PLAYER, CommandArgType.ENUM, CommandArgType.BOOLEAN], Permission);
        this.setPermissionUseCommand(Permission.CONTROL_PERMISSION);
        this.addArgsTypes([CommandArgType.PLAYER]);
    }

    public runServer(client: NetworkClient, args: [number, Permission, boolean]): boolean {
        let user = UsersStorage.getUserIfCreate(args[0]);

        if(args.length == 3){
            let v = args[2] ? 1 : 0;
            user.setPermission(args[1], v);
            this.message(client, "Successfully edit permission, status: %v", v);
            return true;
        }

        let msg = Entity.getNameTag(args[0]);
        forEachEnum(Permission, (name, value) => msg += "\nPermission: "+name+" = "+user.canPermission(value));  
        this.message(client, msg);

        return true;
    }
}

CommandRegistry.registry("pm", new CommandPermission());