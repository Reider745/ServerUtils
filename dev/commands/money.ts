enum ManyControl {
    ADD,
    SET
}

class CommandMoney extends Command {
    constructor(){
        super([CommandArgType.PLAYER, CommandArgType.ENUM, CommandArgType.NUMBER], ManyControl);
        this.setPermissionUseCommand(Permission.CONTROL_MONEY);
        this.addArgsTypes([CommandArgType.PLAYER]);
    }

    public runServer(client: NetworkClient, args: [number, ManyControl, number]): boolean {
        let user = UsersStorage.getUserIfCreate(args[0]);

        if(args.length != 3){
            this.message(client, "User money: "+user.getMoney());
            return true;
        }

        switch(args[1]){
            case ManyControl.ADD:
                user.addMoney(args[2]);
            break;
            case ManyControl.SET:
                user.setMoney(args[2]);
            break;
        }

        this.message(client, "User money: "+user.getMoney());
        return true;
    }
}

CommandRegistry.registry("money", new CommandMoney());